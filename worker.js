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
        const {title,body,date,link_text,link_url,sort_order,page_content}=await request.json();
        if (!title) return new Response(JSON.stringify({error:'Missing title'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const result=await env.DB.prepare('INSERT INTO cards (title,body,date,link_text,link_url,sort_order,page_content) VALUES (?,?,?,?,?,?,?)').bind(title,body||'',date||'',link_text||'',link_url||'',sort_order||0,page_content||'').run();
        return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // CARDS PUT
    if (path.match(/^\/cards\/\d+$/) && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const cardId=path.split('/cards/')[1];
        const {title,body,date,link_text,link_url,sort_order,page_content}=await request.json();
        await env.DB.prepare('UPDATE cards SET title=?,body=?,date=?,link_text=?,link_url=?,sort_order=?,page_content=? WHERE id=?').bind(title,body||'',date||'',link_text||'',link_url||'',sort_order||0,page_content||'',cardId).run();
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

    // ADMIN USERS
    if (path === '/admin/users' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const users=await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(users.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // ADMIN COMMENTS
    if (path === '/admin/comments' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const comments=await env.DB.prepare('SELECT * FROM comments ORDER BY created_at DESC LIMIT 100').all();
        return new Response(JSON.stringify(comments.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
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

    // ROUTE MATCHES
    const storyMatch = path.match(/^\/stories\/(\d+)$/);
    const chapterMatch = path.match(/^\/chapters\/(\d+)$/);
    const storyLikeMatch = path.match(/^\/stories\/(\d+)\/like$/);
    const storyBookmarkMatch = path.match(/^\/stories\/(\d+)\/bookmark$/);
    const storyChapterPostMatch = path.match(/^\/stories\/(\d+)\/chapters$/);
    const adminRoleMatch = path.match(/^\/admin\/users\/(\d+)\/role$/);
    const chapterInfoMatch = path.match(/^\/chapters\/(\d+)\/info$/);
    const storyCharactersMatch = path.match(/^\/stories\/(\d+)\/characters$/);
    const characterMatch = path.match(/^\/characters\/(\d+)$/);
    const chapterCharactersMatch = path.match(/^\/chapters\/(\d+)\/characters$/);
    const chapterCharacterDeleteMatch = path.match(/^\/chapters\/(\d+)\/characters\/(\d+)$/);
    const storyWorldMatch = path.match(/^\/stories\/(\d+)\/world$/);
    const storyBooksMatch = path.match(/^\/stories\/(\d+)\/books$/);
    const bookMatch = path.match(/^\/books\/(\d+)$/);
    const bookChaptersMatch = path.match(/^\/books\/(\d+)\/chapters$/);
    const bookChapterDeleteMatch = path.match(/^\/books\/(\d+)\/chapters\/(\d+)$/);

    // CHAPTER INFO
    if (chapterInfoMatch) {
      const chapterId = chapterInfoMatch[1];
      if (request.method === 'GET') {
        try {
          const info = await env.DB.prepare("SELECT * FROM chapter_info WHERE chapter_id = ?").bind(chapterId).first();
          return new Response(JSON.stringify(info || { main_idea: '', fundamental_theme: '', extended_synopsis: '' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
      if (request.method === 'POST') {
        const user = await validateToken(request, env);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        try {
          const chapter = await env.DB.prepare("SELECT story_id FROM chapters WHERE id = ?").bind(chapterId).first();
          if (!chapter) return new Response(JSON.stringify({ error: 'Chapter not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(chapter.story_id).first();
          if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const { main_idea, fundamental_theme, extended_synopsis } = await request.json();
          await env.DB.prepare("INSERT INTO chapter_info (chapter_id, main_idea, fundamental_theme, extended_synopsis) VALUES (?, ?, ?, ?) ON CONFLICT(chapter_id) DO UPDATE SET main_idea=excluded.main_idea, fundamental_theme=excluded.fundamental_theme, extended_synopsis=excluded.extended_synopsis, updated_at=CURRENT_TIMESTAMP").bind(chapterId, main_idea||'', fundamental_theme||'', extended_synopsis||'').run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
    }

    // STORY CHARACTERS
    if (storyCharactersMatch) {
      const storyId = storyCharactersMatch[1];
      if (request.method === 'GET') {
        try {
          const chars = await env.DB.prepare("SELECT * FROM characters WHERE story_id = ? ORDER BY name ASC").bind(storyId).all();
          const parsed = (chars.results || []).map(c => ({
              ...c,
              linked_notes: (() => { try { return JSON.parse(c.linked_notes || '{}'); } catch(e) { return {}; } })()
          }));
          return new Response(JSON.stringify({ characters: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
      if (request.method === 'POST') {
        const user = await validateToken(request, env);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        try {
          const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(storyId).first();
          if (!story) return new Response(JSON.stringify({ error: 'Story not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const { name, age, description, hobbies, backstory, personality, motivations, relationships } = await request.json();
          if (!name) return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const result = await env.DB.prepare("INSERT INTO characters (story_id, name, age, description, hobbies, backstory, personality, motivations, relationships) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(storyId, name, age||'', description||'', hobbies||'', backstory||'', personality||'', motivations||'', relationships||'').run();
          return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
    }

    // CHARACTER EDIT/DELETE
    if (characterMatch) {
      const charId = characterMatch[1];
      try {
        await env.DB.prepare("ALTER TABLE characters ADD COLUMN linked_notes TEXT DEFAULT '[]'").run();
      } catch(e) { /* column already exists, ignore */ }
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const character = await env.DB.prepare("SELECT story_id FROM characters WHERE id = ?").bind(charId).first();
        if (!character) return new Response(JSON.stringify({ error: 'Character not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(character.story_id).first();
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (request.method === 'PUT') {
          const { name, age, description, hobbies, backstory, personality, motivations, relationships, linked_notes } = await request.json();
          await env.DB.prepare("UPDATE characters SET name=?, age=?, description=?, hobbies=?, backstory=?, personality=?, motivations=?, relationships=?, linked_notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
              .bind(name, age||'', description||'', hobbies||'', backstory||'', personality||'', motivations||'', relationships||'', JSON.stringify(linked_notes||{}), charId).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (request.method === 'DELETE') {
          await env.DB.prepare("DELETE FROM chapter_characters WHERE character_id = ?").bind(charId).run();
          await env.DB.prepare("DELETE FROM characters WHERE id = ?").bind(charId).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // CHAPTER CHARACTERS GET/POST
    if (chapterCharactersMatch) {
      const chapterId = chapterCharactersMatch[1];
      if (request.method === 'GET') {
        try {
          const chars = await env.DB.prepare("SELECT characters.* FROM characters JOIN chapter_characters ON characters.id = chapter_characters.character_id WHERE chapter_characters.chapter_id = ? ORDER BY characters.name ASC").bind(chapterId).all();
          return new Response(JSON.stringify({ characters: chars.results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
      if (request.method === 'POST') {
        const user = await validateToken(request, env);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        try {
          const chapter = await env.DB.prepare("SELECT story_id FROM chapters WHERE id = ?").bind(chapterId).first();
          const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(chapter.story_id).first();
          if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const { character_id } = await request.json();
          await env.DB.prepare("INSERT OR IGNORE INTO chapter_characters (chapter_id, character_id) VALUES (?, ?)").bind(chapterId, character_id).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
    }

    // CHAPTER CHARACTER DELETE
    if (chapterCharacterDeleteMatch && request.method === 'DELETE') {
      const chapterId = chapterCharacterDeleteMatch[1];
      const charId = chapterCharacterDeleteMatch[2];
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const chapter = await env.DB.prepare("SELECT story_id FROM chapters WHERE id = ?").bind(chapterId).first();
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(chapter.story_id).first();
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        await env.DB.prepare("DELETE FROM chapter_characters WHERE chapter_id = ? AND character_id = ?").bind(chapterId, charId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── STORY WORLD (dynamic fields) ─────────────────────────────────
    if (storyWorldMatch) {
      const storyId = storyWorldMatch[1];

      // Auto-migrate: ensure fields column exists
      try {
        await env.DB.prepare("ALTER TABLE story_world ADD COLUMN fields TEXT DEFAULT '[]'").run();
      } catch(e) { /* column already exists, ignore */ }

      if (request.method === 'GET') {
        try {
          const world = await env.DB.prepare("SELECT fields FROM story_world WHERE story_id = ?").bind(storyId).first();
          let fields = [];
          if (world && world.fields) {
            try { fields = JSON.parse(world.fields); } catch(e) { fields = []; }
          }
          return new Response(JSON.stringify({ fields }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }

      if (request.method === 'POST') {
        const user = await validateToken(request, env);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        try {
          const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(storyId).first();
          if (!story) return new Response(JSON.stringify({ error: 'Story not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const { fields } = await request.json();
          if (!Array.isArray(fields)) return new Response(JSON.stringify({ error: 'fields must be an array' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const fieldsJson = JSON.stringify(fields);
          await env.DB.prepare("INSERT INTO story_world (story_id, fields) VALUES (?, ?) ON CONFLICT(story_id) DO UPDATE SET fields=excluded.fields, updated_at=CURRENT_TIMESTAMP").bind(storyId, fieldsJson).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
    }

    // STORY BOOKS GET/POST
    if (storyBooksMatch) {
      const storyId = storyBooksMatch[1];
      if (request.method === 'GET') {
        try {
          const books = await env.DB.prepare("SELECT * FROM books WHERE story_id = ? ORDER BY sort_order ASC").bind(storyId).all();
          const results = [];
          for (const book of books.results) {
            const chapters = await env.DB.prepare("SELECT chapters.id as chapter_id, chapters.title, chapters.chapter_number, book_chapters.sequence_order FROM chapters JOIN book_chapters ON chapters.id = book_chapters.chapter_id WHERE book_chapters.book_id = ? ORDER BY book_chapters.sequence_order ASC").bind(book.id).all();
            book.chapters = chapters.results;
            results.push(book);
          }
          return new Response(JSON.stringify({ books: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
      if (request.method === 'POST') {
        const user = await validateToken(request, env);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        try {
          const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(storyId).first();
          if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const { name, description, sort_order } = await request.json();
          if (!name) return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const result = await env.DB.prepare("INSERT INTO books (story_id, name, description, sort_order) VALUES (?, ?, ?, ?)").bind(storyId, name, description||'', sort_order||0).run();
          return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      }
    }

    // BOOK EDIT/DELETE
    if (bookMatch) {
      const bookId = bookMatch[1];
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const book = await env.DB.prepare("SELECT story_id FROM books WHERE id = ?").bind(bookId).first();
        if (!book) return new Response(JSON.stringify({ error: 'Book not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(book.story_id).first();
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (request.method === 'PUT') {
          const { name, description, sort_order } = await request.json();
          await env.DB.prepare("UPDATE books SET name=?, description=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name, description||'', sort_order||0, bookId).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (request.method === 'DELETE') {
          await env.DB.prepare("DELETE FROM book_chapters WHERE book_id = ?").bind(bookId).run();
          await env.DB.prepare("DELETE FROM books WHERE id = ?").bind(bookId).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // BOOK CHAPTERS POST
    if (bookChaptersMatch && request.method === 'POST') {
      const bookId = bookChaptersMatch[1];
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const book = await env.DB.prepare("SELECT story_id FROM books WHERE id = ?").bind(bookId).first();
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(book.story_id).first();
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const { chapter_id, sequence_order } = await request.json();
        const chapter = await env.DB.prepare("SELECT story_id FROM chapters WHERE id = ?").bind(chapter_id).first();
        if (!chapter || String(chapter.story_id) !== String(book.story_id)) {
          return new Response(JSON.stringify({ error: 'Invalid chapter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await env.DB.prepare("INSERT OR IGNORE INTO book_chapters (book_id, chapter_id, sequence_order) VALUES (?, ?, ?)").bind(bookId, chapter_id, sequence_order||0).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // BOOK CHAPTER DELETE
    if (bookChapterDeleteMatch && request.method === 'DELETE') {
      const bookId = bookChapterDeleteMatch[1];
      const chapterId = bookChapterDeleteMatch[2];
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const book = await env.DB.prepare("SELECT story_id FROM books WHERE id = ?").bind(bookId).first();
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id = ?").bind(book.story_id).first();
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        await env.DB.prepare("DELETE FROM book_chapters WHERE book_id = ? AND chapter_id = ?").bind(bookId, chapterId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // STORIES LIST
    if (path === '/stories' && request.method === 'GET') {
      try {
        const genre = url.searchParams.get('genre');
        const author = url.searchParams.get('author');
        let query = "SELECT stories.*, users.name as author_name, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count, (SELECT COUNT(*) FROM chapters WHERE story_id=stories.id) as chapter_count FROM stories JOIN users ON stories.user_id=users.id WHERE stories.status='published'";
        const params = [];
        if (genre) { query += " AND stories.genre=?"; params.push(genre); }
        if (author) { query += " AND stories.user_id=?"; params.push(author); }
        query += " ORDER BY stories.updated_at DESC LIMIT 50";
        const stories = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({ stories: stories.results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // STORIES GET ONE
    if (storyMatch && request.method === 'GET') {
      try {
        const storyId = storyMatch[1];
        const story = await env.DB.prepare("SELECT stories.*, users.name as author_name, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count FROM stories JOIN users ON stories.user_id=users.id WHERE stories.id=?").bind(storyId).first();
        if (!story) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const user = await validateToken(request, env);
        if (story.status === 'draft') {
          if (!user || (String(user.id) !== String(story.user_id) && user.role !== 'admin')) {
            return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        const chapters = await env.DB.prepare("SELECT id, title, chapter_number, created_at FROM chapters WHERE story_id=? ORDER BY chapter_number ASC").bind(storyId).all();
        let is_bookmarked = false;
        if (user) {
          const bookmark = await env.DB.prepare("SELECT id FROM story_bookmarks WHERE story_id=? AND user_id=?").bind(storyId, user.id).first();
          is_bookmarked = !!bookmark;
        }
        return new Response(JSON.stringify({ story, chapters: chapters.results, is_bookmarked }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // STORIES CREATE
    if (path === '/stories' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user || (user.role !== 'creator' && user.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const { title, description, genre, status } = await request.json();
        if (!title || title.length > 100) return new Response(JSON.stringify({ error: 'Invalid title' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const res = await env.DB.prepare("INSERT INTO stories (user_id, title, description, genre, status) VALUES (?, ?, ?, ?, ?)").bind(user.id, title, description || '', genre || 'General', status || 'draft').run();
        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // STORIES UPDATE
    if (storyMatch && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const storyId = storyMatch[1];
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
        if (!story) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const { title, description, genre, status } = await request.json();
        await env.DB.prepare("UPDATE stories SET title=?, description=?, genre=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(title, description, genre, status, storyId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // STORIES DELETE
    if (storyMatch && request.method === 'DELETE') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const storyId = storyMatch[1];
        const story = await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
        if (!story) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (user.role !== 'admin' && String(story.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        await env.DB.prepare("DELETE FROM chapters WHERE story_id=?").bind(storyId).run();
        await env.DB.prepare("DELETE FROM story_likes WHERE story_id=?").bind(storyId).run();
        await env.DB.prepare("DELETE FROM story_bookmarks WHERE story_id=?").bind(storyId).run();
        await env.DB.prepare("DELETE FROM characters WHERE story_id=?").bind(storyId).run();
        await env.DB.prepare("DELETE FROM story_world WHERE story_id=?").bind(storyId).run();
        await env.DB.prepare("DELETE FROM books WHERE story_id=?").bind(storyId).run();
        await env.DB.prepare("DELETE FROM stories WHERE id=?").bind(storyId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // CHAPTERS GET ONE
    if (chapterMatch && request.method === 'GET') {
      try {
        const chapterId = chapterMatch[1];
        const chapter = await env.DB.prepare("SELECT chapters.*, stories.user_id as story_user_id, stories.status as story_status FROM chapters JOIN stories ON chapters.story_id=stories.id WHERE chapters.id=?").bind(chapterId).first();
        if (!chapter) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const user = await validateToken(request, env);
        if (chapter.story_status === 'draft') {
          if (!user || (String(user.id) !== String(chapter.story_user_id) && user.role !== 'admin')) {
            return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        const prev = await env.DB.prepare("SELECT id, title FROM chapters WHERE story_id=? AND chapter_number < ? ORDER BY chapter_number DESC LIMIT 1").bind(chapter.story_id, chapter.chapter_number).first();
        const next = await env.DB.prepare("SELECT id, title FROM chapters WHERE story_id=? AND chapter_number > ? ORDER BY chapter_number ASC LIMIT 1").bind(chapter.story_id, chapter.chapter_number).first();
        if (chapter) {
          try { chapter.linked_notes = JSON.parse(chapter.linked_notes || '[]'); }
          catch(e) { chapter.linked_notes = []; }
        }
        return new Response(JSON.stringify({ chapter, prev, next }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // CHAPTERS CREATE
    if (storyChapterPostMatch && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const storyId = storyChapterPostMatch[1];
        const owner = await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
        if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (user.role !== 'admin' && String(owner.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const { title, body, chapter_number } = await request.json();
        if (!title || !body) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        let chapter_num = chapter_number;
        if (!chapter_num) {
          const max = await env.DB.prepare("SELECT MAX(chapter_number) as max_num FROM chapters WHERE story_id=?").bind(storyId).first();
          chapter_num = (max?.max_num || 0) + 1;
        }
        const res = await env.DB.prepare("INSERT INTO chapters (story_id, title, body, chapter_number) VALUES (?, ?, ?, ?)").bind(storyId, title, body, chapter_num).run();
        await env.DB.prepare("UPDATE stories SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(storyId).run();
        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

if (chapterMatch && request.method === 'PUT') {
      try {
        await env.DB.prepare("ALTER TABLE chapters ADD COLUMN linked_notes TEXT DEFAULT '[]'").run();
      } catch(e) { /* column already exists */ }
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const chapterId = chapterMatch[1];
        const owner = await env.DB.prepare("SELECT stories.user_id FROM chapters JOIN stories ON chapters.story_id=stories.id WHERE chapters.id=?").bind(chapterId).first();
        if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (user.role !== 'admin' && String(owner.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const { title, body, chapter_number, linked_notes } = await request.json();
        await env.DB.prepare("UPDATE chapters SET title=?, body=?, chapter_number=?, linked_notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(title, body, chapter_number, JSON.stringify(linked_notes || []), chapterId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // CHAPTERS DELETE
    if (chapterMatch && request.method === 'DELETE') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const chapterId = chapterMatch[1];
        const owner = await env.DB.prepare("SELECT stories.user_id FROM chapters JOIN stories ON chapters.story_id=stories.id WHERE chapters.id=?").bind(chapterId).first();
        if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (user.role !== 'admin' && String(owner.user_id) !== String(user.id)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        await env.DB.prepare("DELETE FROM chapters WHERE id=?").bind(chapterId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // LIKE TOGGLE
    if (storyLikeMatch && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const storyId = storyLikeMatch[1];
        const existing = await env.DB.prepare("SELECT id FROM story_likes WHERE story_id=? AND user_id=?").bind(storyId, user.id).first();
        let liked = false;
        if (existing) {
          await env.DB.prepare("DELETE FROM story_likes WHERE id=?").bind(existing.id).run();
        } else {
          await env.DB.prepare("INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)").bind(storyId, user.id).run();
          liked = true;
        }
        const count = await env.DB.prepare("SELECT COUNT(*) as count FROM story_likes WHERE story_id=?").bind(storyId).first();
        return new Response(JSON.stringify({ liked, like_count: count.count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // BOOKMARK TOGGLE
    if (storyBookmarkMatch && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const storyId = storyBookmarkMatch[1];
        const existing = await env.DB.prepare("SELECT id FROM story_bookmarks WHERE story_id=? AND user_id=?").bind(storyId, user.id).first();
        let bookmarked = false;
        if (existing) {
          await env.DB.prepare("DELETE FROM story_bookmarks WHERE id=?").bind(existing.id).run();
        } else {
          await env.DB.prepare("INSERT INTO story_bookmarks (story_id, user_id) VALUES (?, ?)").bind(storyId, user.id).run();
          bookmarked = true;
        }
        return new Response(JSON.stringify({ bookmarked }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // USER BOOKMARKS
    if (path === '/user/bookmarks' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const stories = await env.DB.prepare("SELECT stories.*, users.name as author_name, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count, (SELECT COUNT(*) FROM chapters WHERE story_id=stories.id) as chapter_count FROM story_bookmarks JOIN stories ON story_bookmarks.story_id=stories.id JOIN users ON stories.user_id=users.id WHERE story_bookmarks.user_id=? ORDER BY story_bookmarks.created_at DESC").bind(user.id).all();
        return new Response(JSON.stringify({ stories: stories.results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // NOTES GET
    if (path === '/notes' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const notes = await env.DB.prepare('SELECT id,title,body,tags,pinned,created_at,updated_at FROM notes WHERE user_id=? ORDER BY pinned DESC, updated_at DESC').bind(user.id).all();
        return new Response(JSON.stringify({notes:notes.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // NOTES POST
    if (path === '/notes' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const {title,body,tags,pinned} = await request.json();
        const result = await env.DB.prepare('INSERT INTO notes (user_id,title,body,tags,pinned) VALUES (?,?,?,?,?)').bind(user.id,title||'',body||'',tags||'',pinned||0).run();
        return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }

    // NOTES PUT
    if (path.startsWith('/notes/') && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const noteId = path.split('/notes/')[1];
        const {title,body,tags,pinned} = await request.json();
        const note = await env.DB.prepare('SELECT user_id FROM notes WHERE id=?').bind(noteId).first();
        if (!note) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        if (String(note.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        await env.DB.prepare('UPDATE notes SET title=?,body=?,tags=?,pinned=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title||'',body||'',tags||'',pinned||0,noteId).run();
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

    // ADMIN STORIES
    if (path === '/admin/stories' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const stories = await env.DB.prepare("SELECT stories.*, users.name as author_name FROM stories JOIN users ON stories.user_id=users.id ORDER BY stories.created_at DESC LIMIT 100").all();
        return new Response(JSON.stringify(stories.results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ADMIN UPDATE USER ROLE
    if (adminRoleMatch && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const targetId = adminRoleMatch[1];
        if (String(targetId) === String(user.id)) return new Response(JSON.stringify({ error: 'Cannot change own role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const { role } = await request.json();
        if (!['reader', 'creator', 'admin'].includes(role)) return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        await env.DB.prepare("UPDATE users SET role=? WHERE id=?").bind(role, targetId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // MY STORIES
    if (path === '/my/stories' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user || (user.role !== 'creator' && user.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const stories = await env.DB.prepare("SELECT stories.*, (SELECT COUNT(*) FROM chapters WHERE story_id=stories.id) as chapter_count, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count FROM stories WHERE user_id=? ORDER BY updated_at DESC").bind(user.id).all();
        return new Response(JSON.stringify({ stories: stories.results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }


    // ── HORIZON CHECK ─────────────────────────────────────────────
    if (path === '/horizon/check' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ access: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const row = await env.DB.prepare('SELECT horizon_access FROM users WHERE id=?').bind(user.id).first();
        const access = user.role === 'admin' || !!(row?.horizon_access);
        return new Response(JSON.stringify({ access }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ access: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── HORIZON PROJECTS GET (list) ────────────────────────────────
    if (path === '/horizon/projects' && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const row = await env.DB.prepare('SELECT horizon_access FROM users WHERE id=?').bind(user.id).first();
        if (user.role !== 'admin' && !(row?.horizon_access)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const projects = await env.DB.prepare('SELECT id, title, description, created_at FROM horizon_projects ORDER BY created_at DESC').all();
        return new Response(JSON.stringify({ projects: projects.results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── HORIZON PROJECTS GET ONE ───────────────────────────────────
    const horizonProjectMatch = path.match(/^\/horizon\/projects\/(\d+)$/);
    if (horizonProjectMatch && request.method === 'GET') {
      const user = await validateToken(request, env);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const row = await env.DB.prepare('SELECT horizon_access FROM users WHERE id=?').bind(user.id).first();
        if (user.role !== 'admin' && !(row?.horizon_access)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const project = await env.DB.prepare('SELECT * FROM horizon_projects WHERE id=?').bind(horizonProjectMatch[1]).first();
        if (!project) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify(project), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── HORIZON PROJECTS POST ──────────────────────────────────────
    if (path === '/horizon/projects' && request.method === 'POST') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const { title, description, html_code } = await request.json();
        if (!title) return new Response(JSON.stringify({ error: 'Title required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const result = await env.DB.prepare('INSERT INTO horizon_projects (title, description, html_code) VALUES (?,?,?)').bind(title, description||'', html_code||'').run();
        return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── HORIZON PROJECTS PUT ───────────────────────────────────────
    if (horizonProjectMatch && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const { title, description, html_code } = await request.json();
        await env.DB.prepare('UPDATE horizon_projects SET title=?, description=?, html_code=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title, description||'', html_code||'', horizonProjectMatch[1]).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── HORIZON PROJECTS DELETE ────────────────────────────────────
    if (horizonProjectMatch && request.method === 'DELETE') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        await env.DB.prepare('DELETE FROM horizon_projects WHERE id=?').bind(horizonProjectMatch[1]).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    // ── ADMIN STAR TOGGLE ──────────────────────────────────────────
    const adminHorizonMatch = path.match(/^\/admin\/users\/(\d+)\/horizon$/);
    if (adminHorizonMatch && request.method === 'PUT') {
      const user = await validateToken(request, env);
      if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const { horizon_access } = await request.json();
        await env.DB.prepare('UPDATE users SET horizon_access=? WHERE id=?').bind(horizon_access ? 1 : 0, adminHorizonMatch[1]).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    }

    return new Response('Not found', { status: 404 });
  },
};
