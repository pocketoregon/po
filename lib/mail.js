// lib/mail.js
import { validateToken } from './shared.js';
import PostalMime from './postal-mime.js';

// Parses a stored raw email into readable subject, sender and text.
async function parseStored(raw) {
  try {
    const email = await PostalMime.parse(raw);
    const from = email.from
      ? (email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address)
      : '';
    return {
      subject: email.subject || '(no subject)',
      from,
      text: (email.text || '').trim(),
    };
  } catch (e) {
    return null;
  }
}

const FROM_ADDRESS = 'PocketOregon <hello@pocketoregon.site>';

// Pulls readable text out of a raw MIME email (multipart, base64, quoted-printable)
function extractText(raw) {
  const crlf = raw.indexOf('\r\n\r\n');
  const lf = raw.indexOf('\n\n');
  const splitAt = crlf !== -1 ? crlf : lf;
  if (splitAt === -1) return raw.trim();
  const head = raw.slice(0, splitAt);
  const body = raw.slice(splitAt + (crlf !== -1 ? 4 : 2));

  const ct = (head.match(/content-type:\s*([^;\r\n]+)/i) || [])[1] || 'text/plain';
  const boundary = (head.match(/boundary="?([^";\r\n]+)"?/i) || [])[1];

  if (/multipart/i.test(ct) && boundary) {
    const parts = body.split('--' + boundary);
    for (const p of parts) {
      if (/content-type:\s*text\/plain/i.test(p)) return extractText(p.replace(/^\s+/, ''));
    }
    return '';
  }

  const enc = (head.match(/content-transfer-encoding:\s*([^\r\n]+)/i) || [])[1] || '';
  if (/base64/i.test(enc)) {
    try { return atob(body.replace(/\s+/g, '')).trim(); } catch (e) { return body.trim(); }
  }
  if (/quoted-printable/i.test(enc)) {
    return body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))).trim();
  }
  return body.trim();
}

export async function sendEmail(env, { from, to, subject, html, text, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Resend send failed');
  return data;
}

// Called by Cloudflare Email Routing when mail arrives at a Worker-routed address.
// Deletes messages past their expiry that are not marked keep.
// Old rows without expires_at fall back to created_at + 30 days.
export async function cleanupExpiredMail(env) {
  return await env.DB.prepare(
    "DELETE FROM mail_messages WHERE keep = 0 AND COALESCE(expires_at, datetime(created_at, '+30 days')) < datetime('now')"
  ).run();
}

export async function handleInboundEmail(message, env) {
  const from = message.headers.get('from') || message.from;
  const to = message.to.toLowerCase();
  const subject = message.headers.get('subject') || '(no subject)';
  const raw = await new Response(message.raw).text();
  const text = extractText(raw);

  // Only addresses registered in the mailboxes table accept mail
  const mailbox = await env.DB.prepare(
    "SELECT id, user_id FROM mailboxes WHERE address = ? AND status = 'active'"
  ).bind(to).first();

  if (!mailbox) {
    message.setReject('Address not found');
    return;
  }

  // Stored for 30 days unless keep = 1 is set later
  await env.DB.prepare(
    "INSERT INTO mail_messages (direction, user_id, mailbox_id, from_addr, to_addr, subject, body, folder, is_read, keep, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now','+30 days'))"
  ).bind('in', mailbox.user_id, mailbox.id, from, to, subject, raw, 'inbox', 0, 0).run();
}

// Route handler for /mail/* endpoints.
export async function handleMail(path, request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://pocketoregon.site',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const user = await validateToken(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // Any user with an active mailbox can send, using that mailbox as the sender.
  if (path === '/mail/send' && request.method === 'POST') {
    const body = await request.clone().json().catch(() => ({}));
    const mid = body.mailbox_id ? parseInt(body.mailbox_id) : null;
    const mailbox = await env.DB.prepare(
      "SELECT id, address FROM mailboxes WHERE user_id = ? AND status = 'active' AND (? IS NULL OR id = ?) ORDER BY id ASC LIMIT 1"
    ).bind(user.id, mid, mid).first();
    if (!mailbox) return json({ error: 'You do not have an active mailbox yet.' }, 403);
    try {
      const { to, subject, html } = await request.json();
      if (!to || !subject || !html) return json({ error: 'Missing fields' }, 400);
      if (subject.length > 200 || html.length > 100000) return json({ error: 'Too long' }, 400);

      // Internal delivery: if the recipient is one of our active mailboxes, skip Resend
      const toAddr = String(to).trim().toLowerCase();
      const target = await env.DB.prepare(
        "SELECT id, user_id FROM mailboxes WHERE address = ? AND status = 'active'"
      ).bind(toAddr).first();
      if (target) {
        await env.DB.prepare(
          "INSERT INTO mail_messages (direction, user_id, mailbox_id, from_addr, to_addr, subject, body, folder, is_read, keep, expires_at) VALUES ('in', ?, ?, ?, ?, ?, ?, 'inbox', 0, 0, datetime('now','+30 days'))"
        ).bind(target.user_id, target.id, mailbox.address, toAddr, subject, html).run();
        await env.DB.prepare(
          "INSERT INTO mail_messages (direction, user_id, mailbox_id, from_addr, to_addr, subject, body, folder, is_read, keep, expires_at) VALUES ('out', ?, ?, ?, ?, ?, ?, 'sent', 1, 0, datetime('now','+30 days'))"
        ).bind(user.id, mailbox.id, mailbox.address, toAddr, subject, html).run();
        return json({ success: true, internal: true });
      }

      const result = await sendEmail(env, { from: mailbox.address, to, subject, html, replyTo: mailbox.address });
      await env.DB.prepare(
        "INSERT INTO mail_messages (direction, user_id, mailbox_id, from_addr, to_addr, subject, body, folder, is_read, keep, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now','+30 days'))"
      ).bind('out', user.id, mailbox.id, mailbox.address, String(to), subject, html, 'sent', 1, 0).run();
      return json({ success: true, id: result.id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // Users list their own active mailboxes
  if (path === '/mail/mailboxes' && request.method === 'GET') {
    const rows = await env.DB.prepare(
      "SELECT id, address, status FROM mailboxes WHERE user_id = ? ORDER BY id ASC"
    ).bind(user.id).all();
    return json({ mailboxes: rows.results });
  }

  // Admin lists all mailboxes with their owners
  if (path === '/mail/admin/mailboxes' && request.method === 'GET') {
    if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
    const rows = await env.DB.prepare(
      "SELECT m.id, m.address, m.status, m.user_id, m.created_at, u.name AS owner_name, u.email AS owner_email FROM mailboxes m LEFT JOIN users u ON u.id = m.user_id ORDER BY m.id DESC"
    ).all();
    return json({ mailboxes: rows.results });
  }

  // Admin creates a mailbox for a user. Body: { name: "ali", user_id: 2 }
  if (path === '/mail/admin/mailboxes' && request.method === 'POST') {
    if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
    try {
      const { name, user_id } = await request.json();
      const local = String(name || '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{1,31}$/.test(local)) return json({ error: 'Invalid name' }, 400);
      if (!user_id) return json({ error: 'Missing user_id' }, 400);
      const address = local + '@pocketoregon.site';
      await env.DB.prepare(
        "INSERT INTO mailboxes (address, user_id, status) VALUES (?, ?, 'active')"
      ).bind(address, user_id).run();
      return json({ success: true, address });
    } catch (e) {
      return json({ error: e.message }, 400);
    }
  }

  // Returns the plain text of a stored message, whatever shape it was stored in
  function cleanBody(raw) {
    const s = String(raw || '').replace(/\r\n/g, '\n');
    const idx = s.search(/content-type:\s*text\/plain/i);
    if (idx !== -1) {
      const after = s.slice(idx);
      const blank = after.indexOf('\n\n');
      if (blank !== -1) {
        let t = after.slice(blank + 2);
        const enc = (after.slice(0, blank).match(/content-transfer-encoding:\s*([^\n]+)/i) || [])[1] || '';
        if (/base64/i.test(enc)) {
          const stop = t.search(/\n--[^\n]+/);
          const chunk = stop !== -1 ? t.slice(0, stop) : t;
          try { t = decodeURIComponent(escape(atob(chunk.replace(/\s+/g, '')))); } catch (e) {}
        } else if (/quoted-printable/i.test(enc)) {
          t = t.replace(/=\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)));
        }
        const end = t.search(/\n--[^\n]+/);
        if (end !== -1) t = t.slice(0, end);
        return t.trim();
      }
    }
    return s
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .filter(l => !/^--\S*$/.test(l.trim()) && !/^content-[a-z-]+:/i.test(l.trim()))
      .join('\n')
      .trim();
  }

  // Open a single message (only if it belongs to this user)
  // Mark or unmark a message as kept (only the owner can change it)
  const keepMatch = path.match(/^\/mail\/message\/(\d+)\/keep$/);
  if (keepMatch && request.method === 'POST') {
    const { keep } = await request.json();
    const flag = keep ? 1 : 0;
    await env.DB.prepare(
      'UPDATE mail_messages SET keep = ? WHERE id = ? AND user_id = ?'
    ).bind(flag, keepMatch[1], user.id).run();
    return json({ success: true, keep: flag });
  }

  const msgMatch = path.match(/^\/mail\/message\/(\d+)$/);
  if (msgMatch && request.method === 'GET') {
    const row = await env.DB.prepare(
      'SELECT id, direction, mailbox_id, from_addr, to_addr, subject, body, folder, is_read, keep, created_at FROM mail_messages WHERE id = ? AND user_id = ?'
    ).bind(msgMatch[1], user.id).first();
    if (!row) return json({ error: 'Not found' }, 404);
    if (row.direction === 'in' && !row.is_read) {
      await env.DB.prepare('UPDATE mail_messages SET is_read = 1 WHERE id = ?').bind(row.id).run();
    }
    row.body = cleanBody(row.body);

    return json({ message: row });
  }

  if (path === '/mail' && request.method === 'GET') {
    const params = new URL(request.url).searchParams;
    const folder = params.get('folder') || 'inbox';
    const mid = params.get('mailbox_id') ? parseInt(params.get('mailbox_id')) : null;
    const rows = await env.DB.prepare(
      "SELECT id, direction, mailbox_id, from_addr, to_addr, subject, folder, is_read, created_at, (SELECT u.avatar_style FROM mailboxes m JOIN users u ON u.id = m.user_id WHERE m.address = mail_messages.from_addr LIMIT 1) AS sender_style, (SELECT u.avatar_seed FROM mailboxes m JOIN users u ON u.id = m.user_id WHERE m.address = mail_messages.from_addr LIMIT 1) AS sender_seed FROM mail_messages WHERE user_id = ? AND folder = ? AND (? IS NULL OR mailbox_id = ?) ORDER BY created_at DESC LIMIT 100"
    ).bind(user.id, folder, mid, mid).all();
    return json({ messages: rows.results });
  }

  return null;
}
