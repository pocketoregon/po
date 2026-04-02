import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

export async function handleAdmin(path, request, env) {
  const adminRoleMatch = path.match(/^\/admin\/users\/(\d+)\/role$/);
  const adminHorizonMatch = path.match(/^\/admin\/users\/(\d+)\/horizon$/);

  if (path === '/admin/users' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const users=await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
      return new Response(JSON.stringify(users.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/admin/comments' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const comments=await env.DB.prepare('SELECT * FROM comments ORDER BY created_at DESC LIMIT 100').all();
      return new Response(JSON.stringify(comments.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/admin/chats' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const chats=await env.DB.prepare('SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 100').all();
      return new Response(JSON.stringify(chats.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/admin/stories' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const stories=await env.DB.prepare("SELECT stories.*, users.name as author_name FROM stories JOIN users ON stories.user_id=users.id ORDER BY stories.created_at DESC LIMIT 100").all();
      return new Response(JSON.stringify(stories.results),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (adminRoleMatch && request.method === 'PUT') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const targetId = adminRoleMatch[1];
      if (String(targetId) === String(user.id)) return new Response(JSON.stringify({error:'Cannot change own role'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const { role } = await request.json();
      if (!['reader','creator','admin'].includes(role)) return new Response(JSON.stringify({error:'Invalid role'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare("UPDATE users SET role=? WHERE id=?").bind(role, targetId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (adminHorizonMatch && request.method === 'PUT') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const { horizon_access } = await request.json();
      await env.DB.prepare('UPDATE users SET horizon_access=? WHERE id=?').bind(horizon_access ? 1 : 0, adminHorizonMatch[1]).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  return null;
}
