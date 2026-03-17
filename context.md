# PocketOregon Site - Full Context File
# Last updated: March 17, 2026 (Database & Session Fixes)
# NOTE TO AI: Always ask the user to paste the current file contents before making any changes. Never edit blindly based on memory.

## SITE INFO
- Site: pocketoregon.site
- GitHub repo: pocketoregon/po (PUBLIC repo — must stay public for GitHub Pages)
- Cloudflare Worker: po.pocketoregon.workers.dev
- Custom API domain: api.pocketoregon.site (exists but BLOCKED by local ISP — do not use as WORKER_URL)
- WORKER_URL in all HTML files: https://po.pocketoregon.workers.dev (confirmed working)
- Google OAuth Client ID: 930005975840-u809k2ldaa6cug4jm82tafb5vahoou4h.apps.googleusercontent.com
- Admin email: pocketoregon@gmail.com

## INFRASTRUCTURE
- Hosted: GitHub Pages (free, requires public repo)
- Worker: Cloudflare Workers (worker.js)
  - GitHub auto-deploy is DISCONNECTED — worker.js is deployed ONLY via Cloudflare editor
  - CRITICAL: Do NOT reconnect GitHub to Worker — it causes auto-deploy overwrites
- Database: Cloudflare D1 — "pocketoregon-db"
  - Database ID: 5042c46f-e454-4af5-a203-391b8e1119d0
- AI: Cloudflare Workers AI (llama-3.2-1b-instruct)
- Domain DNS: Cloudflare (transferred from Hostinger)
  - Cloudflare nameservers: cass.ns.cloudflare.com, matias.ns.cloudflare.com
  - Hostinger holds domain registration, Cloudflare manages DNS

## WORKER BINDINGS (in Cloudflare dashboard)
- AI → Workers AI
- DB → pocketoregon-db (D1)

## wrangler.toml (in GitHub repo — only used for reference now)
name = "po"
main = "worker.js"
compatibility_date = "2024-01-01"
[ai]
binding = "AI"
[[d1_databases]]
binding = "DB"
database_name = "pocketoregon-db"
database_id = "5042c46f-e454-4af5-a203-391b8e1119d0"
[observability]
enabled = true

## DATABASE TABLES (D1)
- users (id, email, name, role, created_at)
- chat_history (id, user_id, message, reply, created_at)
- comments (id, user_id, chapter, text, created_at)
- content (key, value, updated_at) — homepage text blocks editable from admin
- cards (id, title, body, date, link_text, sort_order, page_content, created_at) — homepage cards
- notes (id, user_id, title, body, created_at, updated_at) — E2E encrypted user notes
- sessions (token TEXT PRIMARY KEY, user_id, email, expires_at) — session tokens, 7-day expiry

## FILES IN REPO
- index.html — main site with comments, AI chat, dynamic cards/content, loading curtain.
- signin.html — Dedicated sign-in page with Google authentication.
- admin.html — admin panel (protected by pocketoregon@gmail.com)
- profile.html — per-user profile page at /profile.html?id=USER_ID (Email hidden from public)
- notes/index.html — private notes app at /notes (E2E encrypted)
- worker.js — Cloudflare Worker (in GitHub for reference ONLY — deployed via Cloudflare editor)
- wrangler.toml — worker config (reference only)
- CNAME — pocketoregon.site
- sitemap.xml — SEO sitemap
- robots.txt — blocks /admin.html from Google
- google7b31ba0e9c0ccb1a.html — Google Search Console verification (never delete)
- favicon.ico, favicon.svg, favicon-96x96.png, apple-touch-icon.png — favicons
- web-app-manifest-192x192.png, web-app-manifest-512x512.png — PWA icons
- site.webmanifest — PWA manifest

## WORKER ROUTES (worker.js)
- POST /auth — Google OAuth login → returns user + sessionToken
- POST /auth/logout — deletes session token from D1
- GET  /profile?userId= — user profile data + comments + chat count (public)
- POST /chat — AI chatbot (requires Bearer token)
- GET  /chat/history — fetch chat history (requires Bearer token)
- GET  /comments?chapter=general — fetch comments (public)
- POST /comments — post a comment (requires Bearer token)
- DELETE /comments/:id — delete comment (own or admin, requires Bearer token)
- GET  /content — fetch homepage text blocks (public)
- POST /content — admin update text block (requires Bearer token + admin role)
- GET  /cards — fetch homepage cards (public)
- POST /cards — admin add card (requires Bearer token + admin role)
- PUT  /cards/:id — admin update card (requires Bearer token + admin role)
- DELETE /cards/:id — admin delete card (requires Bearer token + admin role)
- GET  /card/:id — serves full HTML card detail page (clean URL, Worker-rendered)
- GET  /notes — fetch user's notes (requires Bearer token)
- POST /notes — create note (requires Bearer token)
- PUT  /notes/:id — update note (requires Bearer token, ownership verified)
- DELETE /notes/:id — delete note (requires Bearer token, ownership verified)
- GET  /admin/users — admin only (requires Bearer token + admin role)
- GET  /admin/comments — admin only (requires Bearer token + admin role)
- GET  /admin/chats — admin only (requires Bearer token + admin role)

## SECURITY ARCHITECTURE (Two-Layer)
Implemented March 2026 — replaced raw Google ID trust model.

### Layer 1 — Session Tokens
- Worker sends `Cross-Origin-Opener-Policy: same-origin-allow-popups` and `Access-Control-Allow-Credentials: true` for auth endpoints.
- On OAuth login, worker generates crypto.randomUUID() token, stores in sessions table with 7-day expiry.
- Token returned to client as sessionToken alongside user object.
- Client stores token in localStorage as **po_token**.
- Every authenticated request sends Authorization: Bearer <token>.
- Worker validates token via **validateToken()** helper: checks D1, checks expiry, returns {id, email, name, role}.
- Expired tokens are deleted from D1 automatically on next use.
- Raw Google ID is NEVER trusted from the client.

### Layer 2 — Role-Based Access
- Protected routes call **validateToken()** to ensure a valid session exists.
- Admin-only routes check if **user.role === 'admin'** (linked to pocketoregon@gmail.com).
- Ownership checks are performed for deleting comments or managing notes (user.id must match resource owner).

## WHAT IS WORKING ✅
- Google OAuth login with session token (7-day expiry)
- Secure sign-out via /auth/logout (token deleted from D1)
- User profile pages at /profile.html?id=USER_ID
- **Privacy: User emails are only visible to the owner and admins.**
- Comment deletion: users delete own, admin deletes any (both via Bearer token)
- Admin panel: Data tab (Users/Comments/Chats) + Content Editor tab (Homepage text/Cards)
- Notes app at /notes — E2E encrypted using AES-GCM (Web Crypto API)
- Homepage: dynamic cards/content, AI chat, loading curtain, SEO verification.

## ⚠️ DEPLOYMENT RULES — FOLLOW STRICTLY EVERY TIME

### HTML files:
- Edit in GitHub repo → Commit → GitHub Pages auto-deploys in ~2 minutes.

### worker.js — SPECIAL PROCEDURE:
1. Edit worker.js in GitHub (keeps repo in sync).
2. Go to Cloudflare → Workers & Pages → po → Edit code.
3. Select all → paste new worker.js → Deploy.
- GitHub and Cloudflare are DISCONNECTED — GitHub commits do NOT auto-deploy worker.
- Worker only updates when you manually paste + deploy in Cloudflare editor.

## DNS SETUP
- A records for pocketoregon.site → DNS only (grey cloud, NOT proxied).
- Worker api.pocketoregon.site → Proxied (orange cloud).
- HTTP/3 (QUIC) disabled in Cloudflare Speed → Optimization.

## ISP / NETWORK NOTES
- api.pocketoregon.site is fully blocked locally in Pakistan (proxied through Cloudflare).
- WORKER_URL must stay as workers.dev — api.pocketoregon.site breaks locally.

## SEO STATUS
- Google Search Console: verified ✅
- Sitemap submitted ✅
- robots.txt: allows all except /admin.html

## CLOUDFLARE FREE TIER LIMITS
- Workers AI: ~10,000 neurons/day
- Workers requests: 100k/day
- D1 reads: 5M/day
- Resets: midnight UTC

## NO NODE.JS — all edits via GitHub web editor + Cloudflare dashboard
## EVERYTHING MUST STAY 100% FREE
