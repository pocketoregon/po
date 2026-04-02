import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

export async function handleContent(path, request, env) {
  if (path === '/content' && request.method === 'GET') {
    try {
      const rows=await env.DB.prepare('SELECT key,value FROM content').all();
      const content={};(rows.results||[]).forEach(r=>{content[r.key]=r.value;});
      return new Response(JSON.stringify({content}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }
  if (path === '/content' && request.method === 'POST') {
    const user=await validateToken(request,env);
    if (!user||user.role!=='admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const {key,value}=await request.json();
      if (!key) return new Response(JSON.stringify({error:'Missing key'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare('INSERT INTO content (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(key,value).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }
  return null;
}

export async function handleCards(path, request, env) {
  const cardIdMatch = path.match(/^\/cards\/(\d+)$/);

  if (path === '/cards' && request.method === 'GET') {
    try {
      const cards=await env.DB.prepare('SELECT * FROM cards ORDER BY sort_order ASC,created_at ASC').all();
      return new Response(JSON.stringify({cards:cards.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }
  if (path === '/cards' && request.method === 'POST') {
    const user=await validateToken(request,env);
    if (!user||user.role!=='admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const {title,body,date,link_text,link_url,sort_order,page_content}=await request.json();
      if (!title) return new Response(JSON.stringify({error:'Missing title'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const result=await env.DB.prepare('INSERT INTO cards (title,body,date,link_text,link_url,sort_order,page_content) VALUES (?,?,?,?,?,?,?)').bind(title,body||'',date||'',link_text||'',link_url||'',sort_order||0,page_content||'').run();
      return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }
  if (cardIdMatch && request.method === 'PUT') {
    const user=await validateToken(request,env);
    if (!user||user.role!=='admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const {title,body,date,link_text,link_url,sort_order,page_content}=await request.json();
      await env.DB.prepare('UPDATE cards SET title=?,body=?,date=?,link_text=?,link_url=?,sort_order=?,page_content=? WHERE id=?').bind(title,body||'',date||'',link_text||'',link_url||'',sort_order||0,page_content||'',cardIdMatch[1]).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }
  if (path.startsWith('/cards/') && request.method === 'DELETE') {
    const user=await validateToken(request,env);
    if (!user||user.role!=='admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      await env.DB.prepare('DELETE FROM cards WHERE id=?').bind(path.split('/cards/')[1]).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }
  return null;
}
