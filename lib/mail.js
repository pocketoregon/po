// lib/mail.js
import { validateToken } from './shared.js';

const FROM_ADDRESS = 'PocketOregon <hello@pocketoregon.site>';

export async function sendEmail(env, { to, subject, html, text, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
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
export async function handleInboundEmail(message, env) {
  const from = message.from;
  const to = message.to;
  const subject = message.headers.get('subject') || '(no subject)';
  const raw = await new Response(message.raw).text();

  // Store the raw message. Parsing MIME fully is a later step.
  await env.DB.prepare(
    'INSERT INTO mail_messages (direction, from_addr, to_addr, subject, body, folder, is_read) VALUES (?,?,?,?,?,?,?)'
  ).bind('in', from, to, subject, raw, 'inbox', 0).run();
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

  // Only creators and admins can send.
  if (path === '/mail/send' && request.method === 'POST') {
    if (user.role !== 'creator' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
    try {
      const { to, subject, html } = await request.json();
      if (!to || !subject || !html) return json({ error: 'Missing fields' }, 400);
      if (subject.length > 200 || html.length > 100000) return json({ error: 'Too long' }, 400);

      const result = await sendEmail(env, { to, subject, html, replyTo: user.email });
      await env.DB.prepare(
        'INSERT INTO mail_messages (direction, user_id, from_addr, to_addr, subject, body, folder, is_read) VALUES (?,?,?,?,?,?,?,?)'
      ).bind('out', user.id, FROM_ADDRESS, String(to), subject, html, 'sent', 1).run();
      return json({ success: true, id: result.id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (path === '/mail' && request.method === 'GET') {
    const folder = new URL(request.url).searchParams.get('folder') || 'inbox';
    const rows = await env.DB.prepare(
      'SELECT id, direction, from_addr, to_addr, subject, folder, is_read, created_at FROM mail_messages WHERE user_id = ? AND folder = ? ORDER BY created_at DESC LIMIT 100'
    ).bind(user.id, folder).all();
    return json({ messages: rows.results });
  }

  return null;
}
