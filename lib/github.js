export async function githubFile(env, filePath, htmlContent, sha) {
  const encoded = btoa(unescape(encodeURIComponent(htmlContent || '')));
  const body = { message: 'horizon: upsert ' + filePath, content: encoded };
  if (sha) body.sha = sha;
  const res = await fetch('https://api.github.com/repos/pocketoregon/po/contents/' + filePath, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'PocketOregon-Worker' },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function getFileSha(env, filePath) {
  const res = await fetch('https://api.github.com/repos/pocketoregon/po/contents/' + filePath, {
    headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN, 'User-Agent': 'PocketOregon-Worker' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha || null;
}

export async function deleteGithubFile(env, filePath, sha) {
  await fetch('https://api.github.com/repos/pocketoregon/po/contents/' + filePath, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'PocketOregon-Worker' },
    body: JSON.stringify({ message: 'horizon: delete ' + filePath, sha })
  });
}
