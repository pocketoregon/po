import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

export async function handleNotes(path, request, env) {
  if (path === '/notes' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const notes = await env.DB.prepare('SELECT id,title,body,tags,pinned,created_at,updated_at FROM notes WHERE user_id=? ORDER BY pinned DESC, updated_at DESC').bind(user.id).all();
      return new Response(JSON.stringify({notes:notes.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/notes' && request.method === 'POST') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const {title,body,tags,pinned} = await request.json();
      const result = await env.DB.prepare('INSERT INTO notes (user_id,title,body,tags,pinned) VALUES (?,?,?,?,?)').bind(user.id,title||'',body||'',tags||'',pinned||0).run();
      return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

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

  return null;
}
