import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

export async function handleComments(path, request, env) {
  const url = new URL(request.url);

  if (path === '/comments' && request.method === 'GET') {
    try {
      const chapter=url.searchParams.get('chapter')||'general';
      const comments = await env.DB.prepare(`SELECT comments.id,comments.text,comments.created_at,comments.chapter,comments.user_id,users.name FROM comments JOIN users ON comments.user_id=users.id WHERE comments.chapter=? ORDER BY comments.created_at DESC LIMIT 50`).bind(chapter).all();
      return new Response(JSON.stringify({comments:comments.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

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

  if (path.startsWith('/comments/') && request.method === 'DELETE') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const commentId=path.split('/comments/')[1];
      const comment=await env.DB.prepare('SELECT user_id FROM comments WHERE id=?').bind(commentId).first();
      if (!comment) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (user.role !== 'admin' && String(comment.user_id) !== String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(commentId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  return null;
}
