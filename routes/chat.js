import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

const DEFAULT_SYSTEM_PROMPT = `You are the official AI assistant for PocketOregon — a creative fiction website about the Pocketverse saga. Here is everything you know about this site:
SITE INFO:
- Site name: PocketOregon
- Origin date: March 13, 2026
- Purpose: A home for creative fiction projects, primarily the Pocketverse saga
- The Pocketverse is a fiction story universe currently in development
CURRENT PROJECTS:
- Pocket Verse: Character designs and lore are being sketched out (started 03/12/2026)
- Chapters: Chapter release dates coming soon (expected 03/18/2026)
RULES:
- Be friendly, helpful and concise
- If asked about chapters or releases, say they are coming soon
- Answer general questions too, you are a general assistant`;

export async function handleChat(path, request, env) {
  if (path === '/chat/history' && request.method === 'GET') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const chats = await env.DB.prepare('SELECT message,reply,created_at FROM chat_history WHERE user_id=? ORDER BY created_at ASC LIMIT 50').bind(user.id).all();
      return new Response(JSON.stringify({history:chats.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/chat' && request.method === 'POST') {
    const user = await validateToken(request, env);
    if (!user) return new Response(JSON.stringify({error:'Sign in required.'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const body = await request.json();
      const prompt=body.prompt||body.message, history=body.history||[];
      if (!prompt) return new Response(JSON.stringify({error:'No message.'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const customPromptRow = await env.DB.prepare('SELECT value FROM content WHERE key = ?').bind('ai_system_instruction').first();
      const systemPrompt = customPromptRow?.value || DEFAULT_SYSTEM_PROMPT;
      const messages=[{role:'system',content:systemPrompt},...history.slice(-10),{role:'user',content:prompt}];
      const aiResult = await env.AI.run('@cf/meta/llama-3.2-1b-instruct',{messages,max_tokens:256});
      const reply = aiResult?.response??"Sorry, I couldn't generate a response.";
      await env.DB.prepare('INSERT INTO chat_history (user_id,message,reply) VALUES (?,?,?)').bind(user.id,prompt,reply).run();
      return new Response(JSON.stringify({response:reply}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  return null;
}
