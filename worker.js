const GOOGLE_CLIENT_ID = '930005975840-u809k2ldaa6cug4jm82tafb5vahoou4h.apps.googleusercontent.com';
const ADMIN_EMAIL = 'pocketoregon@gmail.com';
const SITE_URL = 'https://pocketoregon.site';

const SYSTEM_PROMPT = `You are the official AI assistant for PocketOregon — a creative fiction website about the Pocketverse saga. Here is everything you know about this site:
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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Email',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // AUTH ROUTE
    if (path === '/auth' && request.method === 'POST') {
      try {
        const { token } = await request.json();
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const data = await res.json();

        if (data.aud !== GOOGLE_CLIENT_ID) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const email = data.email;
        const name = data.name;
        const role = email === ADMIN_EMAIL ? 'admin' : 'reader';

        await env.DB.prepare(
          'INSERT OR IGNORE INTO users (email, name, role) VALUES (?, ?, ?)'
        ).bind(email, name, role).run();

        const user = await env.DB.prepare(
          'SELECT * FROM users WHERE email = ?'
        ).bind(email).first();

        return new Response(JSON.stringify({ user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // CHAT ROUTE
    if (path === '/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const prompt = body.prompt || body.message;
        const userId = body.userId || null;

        if (!prompt) {
          return new Response(JSON.stringify({ error: 'No message provided' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const aiResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ]
        });

        const reply = aiResult?.response ?? "Sorry, I couldn't generate a response.";

        if (userId) {
          await env.DB.prepare(
            'INSERT INTO chat_history (user_id, message, reply) VALUES (?, ?, ?)'
          ).bind(userId, prompt, reply).run();
        }

        // ✅ THE FIX: returns { response } so frontend data.response works
        return new Response(JSON.stringify({ response: reply }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // COMMENTS - GET
    if (path === '/comments' && request.method === 'GET') {
      try {
        const chapter = url.searchParams.get('chapter') || 'general';
        const comments = await env.DB.prepare(`
          SELECT comments.id, comments.text, comments.created_at, comments.chapter,
                 users.name, users.email
          FROM comments
          JOIN users ON comments.user_id = users.id
          WHERE comments.chapter = ?
          ORDER BY comments.created_at DESC
          LIMIT 50
        `).bind(chapter).all();

        return new Response(JSON.stringify({ comments: comments.results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // COMMENTS - POST
    if (path === '/comments' && request.method === 'POST') {
      try {
        const { userId, chapter, text } = await request.json();
        if (!userId || !text) {
          return new Response(JSON.stringify({ error: 'Missing fields' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await env.DB.prepare(
          'INSERT INTO comments (user_id, chapter, text) VALUES (?, ?, ?)'
        ).bind(userId, chapter || 'general', text).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ADMIN - GET USERS
    if (path === '/admin/users' && request.method === 'GET') {
      const adminEmail = request.headers.get('X-Admin-Email');
      if (adminEmail !== ADMIN_EMAIL) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      try {
        const users = await env.DB.prepare(
          'SELECT * FROM users ORDER BY created_at DESC'
        ).all();
        return new Response(JSON.stringify(users.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ADMIN - GET COMMENTS
    if (path === '/admin/comments' && request.method === 'GET') {
      const adminEmail = request.headers.get('X-Admin-Email');
      if (adminEmail !== ADMIN_EMAIL) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      try {
        const comments = await env.DB.prepare(`
          SELECT comments.*, users.name, users.email
          FROM comments
          JOIN users ON comments.user_id = users.id
          ORDER BY comments.created_at DESC
          LIMIT 100
        `).all();
        return new Response(JSON.stringify(comments.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ADMIN - GET CHATS
    if (path === '/admin/chats' && request.method === 'GET') {
      const adminEmail = request.headers.get('X-Admin-Email');
      if (adminEmail !== ADMIN_EMAIL) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      try {
        const chats = await env.DB.prepare(
          'SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 100'
        ).all();
        return new Response(JSON.stringify(chats.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // DEFAULT
    try {
      const body = await request.json();
      const prompt = body.prompt;
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      });
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response('PocketOregon Worker is running!', { headers: corsHeaders });
    }
  }
};
