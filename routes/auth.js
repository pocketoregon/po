import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

export async function handleAuth(path, request, env) {
  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
  const ADMIN_EMAIL = env.ADMIN_EMAIL;

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

  if (path === '/auth/logout' && request.method === 'POST') {
    const auth = request.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split('Bearer ')[1];
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
    return new Response(JSON.stringify({success:true}), { headers: corsHeaders });
  }

  if (path === '/profile' && request.method === 'GET') {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return new Response(JSON.stringify({error:'No userId'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const user = await env.DB.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').bind(userId).first();
      if (!user) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const requester = await validateToken(request, env);
      if (!requester || (requester.id !== user.id && requester.role !== 'admin')) { user.email = '[Hidden]'; }
      const comments = await env.DB.prepare('SELECT id,text,chapter,created_at FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(userId).all();
      const chatCount = await env.DB.prepare('SELECT COUNT(*) as count FROM chat_history WHERE user_id=?').bind(userId).first();
      return new Response(JSON.stringify({user,comments:comments.results,chatCount:chatCount?.count||0}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  return null;
}
