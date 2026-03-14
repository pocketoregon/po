export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const { prompt } = await request.json();

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `You are the official AI assistant for PocketOregon — a creative fiction website about the Pocketverse saga. Here is everything you know about this site:

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
- Answer general questions too, you are a general assistant`
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
