import { getCorsHeaders, validateToken } from '../lib/shared.js';

const REPO = 'pocketoregon/po';

export async function handleDev(path, request, env) {
  if (!path.startsWith('/dev/')) return null;
  const cors = getCorsHeaders(request);
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  const user = await validateToken(request, env);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const gh = (p) => fetch('https://api.github.com/repos/' + REPO + p, {
    headers: {
      'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
      'User-Agent': 'PocketOregon-Worker',
      'Accept': 'application/vnd.github+json'
    }
  });

  try {
    if (path === '/dev/files' && request.method === 'GET') {
      const res = await gh('/git/trees/main?recursive=1');
      if (!res.ok) return json({ error: 'GitHub error ' + res.status }, 502);
      const data = await res.json();
      const files = (data.tree || []).filter(t => t.type === 'blob').map(t => ({ path: t.path, size: t.size }));
      return json({ files });
    }

    if (path === '/dev/file' && request.method === 'PUT') {
      const { path: p, content, sha } = await request.json();
      if (!p || typeof content !== 'string') return json({ error: 'Missing path or content' }, 400);
      if (p.startsWith('.github/') || p.includes('..')) return json({ error: 'This path cannot be edited here' }, 403);
      if (content.length > 1000000) return json({ error: 'File too large' }, 413);
      const body = {
        message: 'admin: edit ' + p,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: 'main'
      };
      if (sha) body.sha = sha;
      const res = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + p.split('/').map(encodeURIComponent).join('/'), {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
          'User-Agent': 'PocketOregon-Worker',
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) return json({ error: data.message || ('GitHub error ' + res.status) }, res.status === 409 ? 409 : 502);
      return json({ success: true, sha: data.content && data.content.sha });
    }

    if (path === '/dev/file' && request.method === 'GET') {
      const p = new URL(request.url).searchParams.get('path');
      if (!p) return json({ error: 'Missing path' }, 400);
      const res = await gh('/contents/' + p.split('/').map(encodeURIComponent).join('/') + '?ref=main');
      if (!res.ok) return json({ error: 'GitHub error ' + res.status }, res.status === 404 ? 404 : 502);
      const data = await res.json();
      if (!data.content) return json({ path: p, sha: data.sha, binary: true, content: '' });
      try {
        const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        return json({ path: p, sha: data.sha, content });
      } catch (e) {
        return json({ path: p, sha: data.sha, binary: true, content: '' });
      }
    }
  } catch (e) {
    return json({ error: e.message }, 500);
  }

  return json({ error: 'Not found' }, 404);
}
