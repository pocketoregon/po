import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';
import { githubFile, getFileSha, deleteGithubFile } from '../lib/github.js';

export async function handleHorizon(path, request, env) {
  const horizonProjectMatch = path.match(/^\/horizon\/projects\/(\d+)$/);

  if (path === '/horizon/check' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({access:false}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const row = await env.DB.prepare('SELECT horizon_access FROM users WHERE id=?').bind(user.id).first();
      const access = user.role === 'admin' || !!(row?.horizon_access);
      return new Response(JSON.stringify({access}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({access:false}),{headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/horizon/projects' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const row = await env.DB.prepare('SELECT horizon_access FROM users WHERE id=?').bind(user.id).first();
      if (user.role !== 'admin' && !(row?.horizon_access)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const projects = await env.DB.prepare('SELECT id,title,slug,description,created_at FROM horizon_projects ORDER BY created_at DESC').all();
      return new Response(JSON.stringify({projects:projects.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/horizon/projects' && request.method === 'POST') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const { title, slug, description, html_code } = await request.json();
      if (!title || !slug) return new Response(JSON.stringify({error:'Title and slug required'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await githubFile(env, 'horizon/projects/' + slug + '.html', html_code || '');
      const result = await env.DB.prepare('INSERT INTO horizon_projects (title,slug,description) VALUES (?,?,?)').bind(title,slug,description||'').run();
      return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (horizonProjectMatch && request.method === 'PUT') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const { title, description, html_code } = await request.json();
      const project = await env.DB.prepare('SELECT slug FROM horizon_projects WHERE id=?').bind(horizonProjectMatch[1]).first();
      if (!project) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const filePath = 'horizon/projects/' + project.slug + '.html';
      await githubFile(env, filePath, html_code || '', await getFileSha(env, filePath));
      await env.DB.prepare('UPDATE horizon_projects SET title=?,description=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title,description||'',horizonProjectMatch[1]).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (horizonProjectMatch && request.method === 'DELETE') {
    const user = await validateToken(request, env);
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const project = await env.DB.prepare('SELECT slug FROM horizon_projects WHERE id=?').bind(horizonProjectMatch[1]).first();
      if (project) {
        const filePath = 'horizon/projects/' + project.slug + '.html';
        const sha = await getFileSha(env, filePath);
        if (sha) await deleteGithubFile(env, filePath, sha);
      }
      await env.DB.prepare('DELETE FROM horizon_projects WHERE id=?').bind(horizonProjectMatch[1]).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  return null;
}
