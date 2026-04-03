import { corsHeaders, checkRateLimit } from './lib/shared.js';
import { renderCardPage } from './lib/cards.js';
import { handleAuth } from './routes/auth.js';
import { handleNotes } from './routes/notes.js';
import { handleChat } from './routes/chat.js';
import { handleComments } from './routes/comments.js';
import { handleAdmin } from './routes/admin.js';
import { handleHorizon } from './routes/horizon.js';
import { handleStories } from './routes/stories.js';
import { handleContent, handleCards } from './routes/content.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders, status: 204 });
    // Maintenance mode
    if (path !== '/auth' && path !== '/auth/logout' && path !== '/content') {
      const siteStatus = await env.DB.prepare("SELECT value FROM content WHERE key='site_status'").first();
      if (siteStatus?.value === 'closed') {
        const auth = request.headers.get('Authorization');
        let isAdmin = false;
        if (auth?.startsWith('Bearer ')) {
          const tok = auth.split('Bearer ')[1];
          const sess = await env.DB.prepare('SELECT user_id FROM sessions WHERE token=?').bind(tok).first();
          if (sess) { const u = await env.DB.prepare('SELECT role FROM users WHERE id=?').bind(sess.user_id).first(); isAdmin = u?.role==='admin'; }
        }
        if (!isAdmin) return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PocketOregon — Maintenance</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#1f1e24;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem}.wrap{max-width:480px}.logo{font-family:'Outfit',sans-serif;font-size:1.1rem;font-weight:800;color:#f97316;margin-bottom:2.5rem;display:flex;align-items:center;justify-content:center;gap:8px}.icon{font-size:3.5rem;margin-bottom:1.5rem}h1{font-family:'Outfit',sans-serif;font-size:2.2rem;font-weight:800;margin-bottom:1rem;color:#fff}p{color:#6b7280;font-size:1rem;line-height:1.7}</style></head><body><div class="wrap"><div class="logo">🔸 PocketOregon</div><div class="icon">🔧</div><h1>Under Maintenance</h1><p>We're doing some work behind the scenes. PocketOregon will be back shortly — thanks for your patience!</p></div></body></html>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    }

        const cardMatch = path.match(/^\/card\/(\d+)$/);
    if (cardMatch && request.method === 'GET') {
      try {
        const card = await env.DB.prepare('SELECT * FROM cards WHERE id = ?').bind(cardMatch[1]).first();
        if (!card) return new Response('<html><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>Not found</h1><a href="/">← Home</a></body></html>',{status:404,headers:{'Content-Type':'text/html'}});
        return new Response(renderCardPage(card), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      } catch(e) { return new Response('Error: '+e.message,{status:500}); }
    }

    // Rate limited routes
    if (path === '/auth' && request.method === 'POST') {
      if (await checkRateLimit(env, ip, 'auth', 10)) return new Response(JSON.stringify({error:'Too many requests'}),{status:429,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    if (path === '/chat' && request.method === 'POST') {
      if (await checkRateLimit(env, ip, 'chat', 20)) return new Response(JSON.stringify({error:'Too many requests'}),{status:429,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    if (path === '/comments' && request.method === 'POST') {
      if (await checkRateLimit(env, ip, 'comments', 15)) return new Response(JSON.stringify({error:'Too many requests'}),{status:429,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    // Route to handlers
    return (
      await handleAuth(path, request, env) ||
      await handleNotes(path, request, env) ||
      await handleChat(path, request, env) ||
      await handleComments(path, request, env) ||
      await handleAdmin(path, request, env) ||
      await handleHorizon(path, request, env) ||
      await handleStories(path, request, env) ||
      await handleContent(path, request, env) ||
      await handleCards(path, request, env) ||
      new Response('Not found', { status: 404 })
    );
  },
};
