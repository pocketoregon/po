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
    if (path === '/dev/status' && request.method === 'GET') {
      const res = await gh('/actions/runs?branch=main&per_page=6');
      if (!res.ok) return json({ error: 'GitHub error ' + res.status }, 502);
      const data = await res.json();
      const runs = (data.workflow_runs || []).map(r => ({
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        sha: (r.head_sha || '').slice(0, 7),
        message: ((r.head_commit && r.head_commit.message) || '').split('\n')[0],
        created_at: r.created_at,
        url: r.html_url
      }));
      return json({ runs });
    }

    if (path === '/dev/file-info' && request.method === 'GET') {
      const p = new URL(request.url).searchParams.get('path');
      if (!p) return json({ error: 'Missing path' }, 400);
      const res = await gh('/commits?sha=main&per_page=1&path=' + encodeURIComponent(p));
      if (!res.ok) return json({ error: 'GitHub error ' + res.status }, 502);
      const data = await res.json();
      const c = data[0];
      if (!c) return json({ found: false });
      return json({
        found: true,
        sha: c.sha.slice(0, 7),
        message: (c.commit.message || '').split('\n')[0],
        date: c.commit.committer && c.commit.committer.date
      });
    }

    if (path === '/dev/files' && request.method === 'GET') {
      const res = await gh('/git/trees/main?recursive=1');
      if (!res.ok) return json({ error: 'GitHub error ' + res.status }, 502);
      const data = await res.json();
      const files = (data.tree || []).filter(t => t.type === 'blob').map(t => ({ path: t.path, size: t.size }));
      return json({ files });
    }

    if (path === '/dev/history' && request.method === 'GET') {
      const url = new URL(request.url);
      const scope = url.searchParams.get('scope') === 'global' ? 'global' : 'file';
      const p = url.searchParams.get('path');
      if (scope === 'file' && !p) return json({ error: 'Missing file path' }, 400);

      const query = '/commits?sha=main&per_page=100' +
        (scope === 'file' ? '&path=' + encodeURIComponent(p) : '');
      const res = await gh(query);
      if (!res.ok) return json({ error: 'GitHub error ' + res.status }, 502);

      const commits = await res.json();
      const undone = new Set();
      const edits = [];

      for (const c of commits || []) {
        const message = c.commit.message || '';
        const undoMatch = message.match(/^admin: undo \[(global|file)\] ([0-9a-f]{40}) (.+)$/);

        if (undoMatch && undoMatch[1] === scope) {
          undone.add(undoMatch[2]);
          continue;
        }

        const tagged = message.match(/^admin: edit \[(global|file)\] (.+)$/);
        if (tagged && tagged[1] === scope) {
          const filePath = tagged[2];
          if (scope === 'global' || filePath === p) {
            edits.push({
              sha: c.sha,
              path: filePath,
              message: message,
              date: (c.commit.committer && c.commit.committer.date) ||
                (c.commit.author && c.commit.author.date),
              undone: undone.has(c.sha)
            });
          }
          continue;
        }

        // Older untagged commits can only be assigned safely to file history.
        const legacy = message.match(/^admin: edit (.+)$/);
        if (scope === 'file' && legacy && legacy[1] === p) {
          edits.push({
            sha: c.sha,
            path: p,
            message: message,
            date: (c.commit.committer && c.commit.committer.date) ||
              (c.commit.author && c.commit.author.date),
            undone: undone.has(c.sha),
            legacy: true
          });
        }
      }

      return json({
        scope,
        items: edits.map(item => ({
          ...item,
          undone: undone.has(item.sha)
        }))
      });
    }

    if (path === '/dev/history/version' && request.method === 'GET') {
      const url = new URL(request.url);
      const p = url.searchParams.get('path');
      const sha = url.searchParams.get('sha');

      if (!p || !sha) return json({ error: 'Missing path or commit SHA' }, 400);
      if (p.startsWith('.github/') || p.includes('..') || p.startsWith('/') || p.includes('\\')) {
        return json({ error: 'Invalid file path' }, 400);
      }

      const filePath = '/contents/' + p.split('/').map(encodeURIComponent).join('/');
      const res = await gh(filePath + '?ref=' + encodeURIComponent(sha));
      if (!res.ok) return json({ error: 'Could not load this version' }, res.status === 404 ? 404 : 502);

      const data = await res.json();
      if (!data.content) return json({ error: 'This version is binary or unavailable for text preview' }, 415);

      try {
        const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        return json({ path: p, sha, content });
      } catch (e) {
        return json({ error: 'Could not decode this version' }, 415);
      }
    }

    if (path === '/dev/undo' && request.method === 'POST') {
      const body = await request.json();
      const scope = body.scope === 'global' ? 'global' : 'file';
      const requestedSha = body.targetSha;
      const requestedPath = body.path;

      if (!requestedSha) return json({ error: 'Missing target commit SHA' }, 400);
      if (scope === 'file' && !requestedPath) return json({ error: 'Missing file path' }, 400);

      const p = requestedPath;
      if (scope === 'file' && (p.startsWith('.github/') || p.includes('..') || p.startsWith('/') || p.includes('\\'))) {
        return json({ error: 'Invalid file path' }, 400);
      }

      const query = '/commits?sha=main&per_page=100' +
        (scope === 'file' ? '&path=' + encodeURIComponent(p) : '');
      const historyRes = await gh(query);
      if (!historyRes.ok) return json({ error: 'GitHub history error ' + historyRes.status }, 502);

      const commits = await historyRes.json();
      const undone = new Set();

      for (const c of commits || []) {
        const message = c.commit.message || '';
        const match = message.match(/^admin: undo \[(global|file)\] ([0-9a-f]{40}) (.+)$/);
        if (match && match[1] === scope) undone.add(match[2]);
      }

      let latest = null;

      for (const c of commits || []) {
        const message = c.commit.message || '';
        const tagged = message.match(/^admin: edit \[(global|file)\] (.+)$/);

        if (tagged && tagged[1] === scope) {
          const filePath = tagged[2];
          if ((scope === 'global' || filePath === p) && !undone.has(c.sha)) {
            latest = { sha: c.sha, path: filePath };
            break;
          }
          continue;
        }

        const legacy = message.match(/^admin: edit (.+)$/);
        if (scope === 'file' && legacy && legacy[1] === p && !undone.has(c.sha)) {
          latest = { sha: c.sha, path: p };
          break;
        }
      }

      if (!latest) return json({ error: 'There are no remaining changes to undo.' }, 404);
      if (latest.sha !== requestedSha) {
        return json({ error: 'History changed. Refresh the history and try again.' }, 409);
      }

      const commitRes = await gh('/git/commits/' + latest.sha);
      if (!commitRes.ok) return json({ error: 'Could not inspect the selected commit' }, 502);
      const commitData = await commitRes.json();
      const parentSha = commitData.parents && commitData.parents[0] && commitData.parents[0].sha;
      if (!parentSha) return json({ error: 'This is the file creation commit and has no previous version to restore.' }, 409);

      const filePath = '/contents/' + latest.path.split('/').map(encodeURIComponent).join('/');
      const previousRes = await gh(filePath + '?ref=' + encodeURIComponent(parentSha));
      const currentRes = await gh(filePath + '?ref=main');

      if (!currentRes.ok) return json({ error: 'The current file could not be loaded. Undo was not applied.' }, 409);
      const currentData = await currentRes.json();

      let writeRes;

      if (previousRes.status === 404) {
        writeRes = await fetch('https://api.github.com/repos/' + REPO + filePath, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
            'User-Agent': 'PocketOregon-Worker',
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'admin: undo [' + scope + '] ' + latest.sha + ' ' + latest.path,
            sha: currentData.sha,
            branch: 'main'
          })
        });
      } else {
        if (!previousRes.ok) return json({ error: 'Could not load the previous file version' }, 502);
        const previousData = await previousRes.json();
        if (!previousData.content) return json({ error: 'The previous version is not a text file' }, 415);

        const previousContent = decodeURIComponent(escape(atob(previousData.content.replace(/\n/g, ''))));
        writeRes = await fetch('https://api.github.com/repos/' + REPO + filePath, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
            'User-Agent': 'PocketOregon-Worker',
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'admin: undo [' + scope + '] ' + latest.sha + ' ' + latest.path,
            content: btoa(unescape(encodeURIComponent(previousContent))),
            sha: currentData.sha,
            branch: 'main'
          })
        });
      }

      const writeData = await writeRes.json();
      if (!writeRes.ok) {
        return json({ error: writeData.message || 'GitHub could not restore this version.' }, writeRes.status === 409 ? 409 : 502);
      }

      return json({
        success: true,
        path: latest.path,
        undoneSha: latest.sha,
        sha: writeData.content && writeData.content.sha
      });
    }

    if (path === '/dev/file' && request.method === 'PUT') {
      const { path: p, content, sha, source } = await request.json();
      if (!p || typeof content !== 'string') return json({ error: 'Missing path or content' }, 400);
      if (p.startsWith('.github/') || p.includes('..')) return json({ error: 'This path cannot be edited here' }, 403);
      if (content.length > 1000000) return json({ error: 'File too large' }, 413);
      const body = {
        message: 'admin: edit [' + (source === 'global' ? 'global' : 'file') + '] ' + p,
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
