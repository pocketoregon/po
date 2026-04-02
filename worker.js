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

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    // Card page
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
