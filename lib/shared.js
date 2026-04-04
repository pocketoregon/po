export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pocketoregon.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Email, X-User-Id',
  'Access-Control-Allow-Credentials': 'true',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
};

export async function validateToken(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split('Bearer ')[1];
  const session = await env.DB.prepare('SELECT user_id, email, expires_at FROM sessions WHERE token = ?').bind(token).first();
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  const user = await env.DB.prepare('SELECT id, email, name, role FROM users WHERE id = ?').bind(session.user_id).first();
  return user;
}

export async function checkRateLimit(env, ip, route, limit) {
  const key = `rate:${ip}:${route}`;
  const now = Date.now();
  const row = await env.DB.prepare("SELECT count, window_start FROM rate_limits WHERE key=?").bind(key).first();
  if (!row || now - row.window_start > 60000) {
    await env.DB.prepare("INSERT INTO rate_limits (key,count,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,window_start=excluded.window_start").bind(key, now).run();
    return false;
  }
  if (row.count >= limit) return true;
  await env.DB.prepare("UPDATE rate_limits SET count=count+1 WHERE key=?").bind(key).run();
  return false;
}
