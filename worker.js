const GOOGLE_CLIENT_ID = '930005975840-u809k2ldaa6cug4jm82tafb5vahoou4h.apps.googleusercontent.com';
const ADMIN_EMAIL = 'pocketoregon@gmail.com';
const SITE_URL = 'https://pocketoregon.site';

const DEFAULT_SYSTEM_PROMPT = `You are the official AI assistant for PocketOregon — a creative fiction website about the Pocketverse saga. Here is everything you know about this site:
SITE INFO:
- Site name: PocketOregon
- Origin date: March 13, 2026
- Purpose: A home for creative fiction projects, primarily the Pocketverse saga
- The Pocketverse is a fiction story universe currently in development
CURRENT PROJECTS:
- Pocket Verse: Character designs and lore are being sketched out (started 03/12/2026)
- Chapters: Chapter release dates coming soon (expected 03/18/2026)
RULES:
- Be friendly, helpful and concise
- If asked about chapters or releases, say they are coming soon
- Answer general questions too, you are a general assistant`;

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pocketoregon.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Email, X-User-Id',
  'Access-Control-Allow-Credentials': 'true',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
};

const corsHeadersWildcard = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Email, X-User-Id',
};

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderCardPage(card) {
  const isSiteInfo = card.date && card.date.includes('Origin');
  const siteAgeDays = Math.floor((Date.now() - new Date('2026-03-13')) / 86400000);
  const dateDisplay = isSiteInfo
    ? `<span>Origin date: 3/13/2026</span><span class="sep">|</span><span class="age-badge">Age: ${siteAgeDays} days</span>`
    : `<span>${escHtml(card.date)}</span>`;
  const contentHtml = card.page_content
    ? card.page_content.split('\n').map(l => l.trim()===''?'<br>':`<p>${escHtml(l)}</p>`).join('')
    : `<div class="empty-content"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg><p>More details coming soon.</p></div>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(card.title)} — PocketOregon</title>
<meta name="description" content="${escHtml(card.body)}">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#ffffff">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;background:#fff;color:#1f1e24;min-height:100vh;}
nav{background:white;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:50;}
.nav-inner{max-width:860px;margin:0 auto;padding:0 1.5rem;height:56px;display:flex;align-items:center;justify-content:space-between;}
.nav-logo{display:flex;align-items:center;gap:8px;text-decoration:none;}
.nav-logo svg{color:#ea580c;}
.nav-logo span{font-family:'Outfit',sans-serif;font-weight:800;font-size:1rem;color:#1f1e24;}
.nav-back{font-size:.875rem;color:#6b7280;text-decoration:none;transition:color .15s;}
.nav-back:hover{color:#1f1e24;}
.hero{background:radial-gradient(circle at 0% 0%,#fff 0%,#fffafa 25%,#fbe9eb 100%);padding:3.5rem 1.5rem 4rem;border-bottom:1px solid #f3f4f6;}
.hero-inner{max-width:860px;margin:0 auto;}
.hero-tag{display:inline-block;background:#fee2e2;color:#dc2626;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:3px 10px;border-radius:999px;margin-bottom:1rem;}
h1{font-family:'Outfit',sans-serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.1;letter-spacing:-.03em;color:#1f1e24;margin-bottom:1rem;}
.meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:.875rem;color:#6b7280;font-weight:500;}
.sep{color:#d1d5db;}.age-badge{color:#ea580c;font-weight:700;}
.content-area{max-width:860px;margin:0 auto;padding:3rem 1.5rem 5rem;}
.summary-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1.25rem 1.5rem;margin-bottom:2.5rem;font-size:1.05rem;color:#374151;line-height:1.65;}
.page-content p{font-size:1rem;line-height:1.8;color:#374151;margin-bottom:1.25rem;}
.empty-content{text-align:center;padding:4rem 2rem;color:#9ca3af;font-size:.95rem;}
.empty-content svg{margin:0 auto 1rem;display:block;}
footer{background:#1f1e24;padding:2.5rem 1.5rem;text-align:center;border-top:1px solid #374151;}
.footer-inner{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;}
footer p{color:#6b7280;font-size:.75rem;}footer span{color:white;font-family:'Outfit',sans-serif;font-weight:700;}
</style>
</head>
<body>
<nav><div class="nav-inner">
<a href="/" class="nav-logo"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 8l3 3 7-4 7 4 3-3-10-6z M12 8l-5 4 5 10 5-10-5-4z"/></svg><span>PocketOregon</span></a>
<a href="/" class="nav-back">← Back to site</a>
</div></nav>
<div class="hero"><div class="hero-inner">
<div class="hero-tag">Project</div>
<h1>${escHtml(card.title)}</h1>
<div class="meta">${dateDisplay}</div>
</div></div>
<div class="content-area">
<div class="summary-box">${escHtml(card.body)}</div>
<div class="page-content">${contentHtml}</div>
</div>
<footer><div class="footer-inner">
<svg width="16" height="16" viewBox="0 0 24 24" fill="#ea580c"><path d="M12 2L2 8l3 3 7-4 7 4 3-3-10-6z M12 8l-5 4 5 10 5-10-5-4z"/></svg>
<span>PocketOregon</span></div>
<p>&copy; 2026 PocketOregon. All rights reserved.</p>
</footer>
</body></html>`;
}

async function validateToken(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split('Bearer ')[1];
  const session = await env.DB.prepare('SELECT user_id, email, expires_at FROM sessions WHERE token = ?').bind(token).first();
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  const user = await env.DB.prepare('SELECT id, email, name, role FROM users WHERE id = ?').bind(session.user_id).first();
  return user;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders, status: 204 });

    // CARD PAGE
    const cardMatch = path.match(/^\/card\/(\d+)$/);
    if (cardMatch && request.method === 'GET') {
      try {
        const card = await env.DB.prepare('SELECT * FROM cards WHERE id = ?').bind(cardMatch[1]).first();
        if (!card) return new Response('<html><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>Not found</h1><a href="/">← Home</a></body></html>',{status:404,headers:{'Content-Type':'text/html'}});
        return new Response(renderCardPage(card), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      } catch(e) { return new Response('Error: '+e.message,{status:500}); }
    }

    // AUTH
    if (path === '/auth' && request.method === 'POST') {
      try {
        const { token } = await request.json();
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const data = await res.json();
        if (data.aud !== GOOGLE_CLIENT_ID) return new Response(JSON.stringify({error:'Invalid token'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const email=data.email, name=data.name, role=email===ADMIN_EMAIL?'admin':'reader';
        await env.DB.prepare('INSERT OR IGNORE INTO users (email,name,role) VALUES (?,?,?)').bind(email,name,role).run();
        const user = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();
        await env.DB.prepare('INSERT INTO sessions (token, user_id, email, expires_at) VALUES (?, ?, ?, ?)').bind(sessionToken, user.id, email, expiresAt).run();
        return new Response(JSON.stringify({user, sessionToken}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // LOGOUT
    if (path === '/auth/logout' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split('Bearer ')[1];
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      }
      return new Response(JSON.stringify({success:true}), { headers: corsHeaders });
    }

    // PROFILE
    if (path === '/profile' && request.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) return new Response(JSON.stringify({error:'No userId'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const user = await env.DB.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').bind(userId).first();
        if (!user) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        
        // Privacy: only show email to owner or admin
        const requester = await validateToken(request, env);
        if (!requester || (requester.id !== user.id && requester.role !== 'admin')) {
          user.email = '[Hidden]';
        }

        const comments = await env.DB.prepare('SELECT id,text,chapter,created_at FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(userId).all();
        const chatCount = await env.DB.prepare('SELECT COUNT(*) as count FROM chat_history WHERE user_id=?').bind(userId).first();
        return new Response(JSON.stringify({user,comments:comments.results,chatCount:chatCount?.count||0}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CHAT HISTORY
    if (path === '/chat/history' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const chats = await env.DB.prepare('SELECT message,reply,created_at FROM chat_history WHERE user_id=? ORDER BY created_at ASC LIMIT 50').bind(user.id).all();
        return new Response(JSON.stringify({history:chats.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CHAT
    if (path === '/chat' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Sign in required.'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const body = await request.json();
        const prompt=body.prompt||body.message, history=body.history||[];
        if (!prompt) return new Response(JSON.stringify({error:'No message.'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        
        // Dynamic system prompt from content table
        const customPromptRow = await env.DB.prepare('SELECT value FROM content WHERE key = ?').bind('ai_system_instruction').first();
        const systemPrompt = customPromptRow?.value || DEFAULT_SYSTEM_PROMPT;
        
        const messages=[{role:'system',content:systemPrompt},...history.slice(-10),{role:'user',content:prompt}];
        const aiResult = await env.AI.run('@cf/meta/llama-3.2-1b-instruct',{messages,max_tokens:256});
        const reply = aiResult?.response??"Sorry, I couldn't generate a response.";
        await env.DB.prepare('INSERT INTO chat_history (user_id,message,reply) VALUES (?,?,?)').bind(user.id,prompt,reply).run();
        return new Response(JSON.stringify({response:reply}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // COMMENTS GET
    if (path === '/comments' && request.method === 'GET') {
      try {
        const chapter=url.searchParams.get('chapter')||'general';
        const comments = await env.DB.prepare(`SELECT comments.id,comments.text,comments.created_at,comments.chapter,comments.user_id,users.name FROM comments JOIN users ON comments.user_id=users.id WHERE comments.chapter=? ORDER BY comments.created_at DESC LIMIT 50`).bind(chapter).all();
        return new Response(JSON.stringify({comments:comments.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // COMMENTS POST
    if (path === '/comments' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const {chapter,text}=await request.json();
        if (!text) return new Response(JSON.stringify({error:'Missing fields'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        await env.DB.prepare('INSERT INTO comments (user_id,chapter,text) VALUES (?,?,?)').bind(user.id,chapter||'general',text).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // COMMENTS DELETE
    if (path.startsWith('/comments/') && request.method === 'DELETE') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const commentId=path.split('/comments/')[1];
        const comment=await env.DB.prepare('SELECT user_id FROM comments WHERE id=?').bind(commentId).first();
        if (!comment) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        
        if (user.role !== 'admin' && String(comment.user_id) !== String(user.id)) {
          return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        }
        
        await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(commentId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CONTENT GET
    if (path === '/content' && request.method === 'GET') {
      try {
        const rows=await env.DB.prepare('SELECT key,value FROM content').all();
        const content={};(rows.results||[]).forEach(r=>{content[r.key]=r.value;});
        return new Response(JSON.stringify({content}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CONTENT POST
    if (path === '/content' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const {key,value}=await request.json();
        if (!key) return new Response(JSON.stringify({error:'Missing key'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        await env.DB.prepare('INSERT INTO content (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(key,value).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CARDS GET
    if (path === '/cards' && request.method === 'GET') {
      try {
        const cards=await env.DB.prepare('SELECT * FROM cards ORDER BY sort_order ASC,created_at ASC').all();
        return new Response(JSON.stringify({cards:cards.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CARDS POST
    if (path === '/cards' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const {title,body,date,link_text,sort_order,page_content}=await request.json();
        if (!title) return new Response(JSON.stringify({error:'Missing title'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const result=await env.DB.prepare('INSERT INTO cards (title,body,date,link_text,sort_order,page_content) VALUES (?,?,?,?,?,?)').bind(title,body||'',date||'',link_text||'',sort_order||0,page_content||'').run();
        return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CARDS PUT
    if (path.startsWith('/cards/') && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const cardId=path.split('/cards/')[1];
        const {title,body,date,link_text,sort_order,page_content}=await request.json();
        await env.DB.prepare('UPDATE cards SET title=?,body=?,date=?,link_text=?,sort_order=?,page_content=? WHERE id=?').bind(title,body||'',date||'',link_text||'',sort_order||0,page_content||'',cardId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CARDS DELETE
    if (path.startsWith('/cards/') && request.method === 'DELETE') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const cardId=path.split('/cards/')[1];
        await env.DB.prepare('DELETE FROM cards WHERE id=?').bind(cardId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // NOTES GET
    if (path === '/notes' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const notes = await env.DB.prepare('SELECT id,title,body,created_at,updated_at FROM notes WHERE user_id=? ORDER BY updated_at DESC').bind(user.id).all();
        return new Response(JSON.stringify({notes:notes.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // NOTES POST
    if (path === '/notes' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const {title,body} = await request.json();
        const result = await env.DB.prepare('INSERT INTO notes (user_id,title,body) VALUES (?,?,?)').bind(user.id,title||'',body||'').run();
        return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // NOTES PUT
    if (path.startsWith('/notes/') && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const noteId = path.split('/notes/')[1];
        const {title,body} = await request.json();
        const note = await env.DB.prepare('SELECT user_id FROM notes WHERE id=?').bind(noteId).first();
        if (!note) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        if (String(note.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        await env.DB.prepare('UPDATE notes SET title=?,body=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title||'',body||'',noteId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // NOTES DELETE
    if (path.startsWith('/notes/') && request.method === 'DELETE') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const noteId = path.split('/notes/')[1];
        const note = await env.DB.prepare('SELECT user_id FROM notes WHERE id=?').bind(noteId).first();
        if (!note) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        if (String(note.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        await env.DB.prepare('DELETE FROM notes WHERE id=?').bind(noteId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // ADMIN USERS
    if (path === '/admin/users' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const users=await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(users.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // ADMIN CHATS
    if (path === '/admin/chats' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const chats=await env.DB.prepare('SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 100').all();
        return new Response(JSON.stringify(chats.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // FALLBACK
    return new Response('Not found', { status: 404 });
  },
};
