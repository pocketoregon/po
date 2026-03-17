# PocketOregon Site - Full Context File
# Last updated: March 17, 2026
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
- index.html — main site with comments, AI chat, dynamic cards/content, loading curtain. "Sign in" redirects to signin.html.
- signin.html — **NEW** Dedicated sign-in page with Google authentication and Manus-style animated background.
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
- GET  /comments?chapter=general — fetch comments (public, includes user_id for delete buttons)
- POST /comments — post a comment (requires Bearer token)
- DELETE /comments/:id — delete comment (own or admin, requires Bearer token)
- GET  /content — fetch homepage text blocks (public)
- POST /content — admin update text block (requires Bearer token + admin email)
- GET  /cards — fetch homepage cards (public)
- POST /cards — admin add card (requires Bearer token + admin email)
- PUT  /cards/:id — admin update card (requires Bearer token + admin email)
- DELETE /cards/:id — admin delete card (requires Bearer token + admin email)
- GET  /card/:id — serves full HTML card detail page (clean URL, Worker-rendered)
- GET  /notes — fetch user's notes (requires Bearer token)
- POST /notes — create note (requires Bearer token)
- PUT  /notes/:id — update note (requires Bearer token, ownership verified)
- DELETE /notes/:id — delete note (requires Bearer token, ownership verified)
- GET  /admin/users — admin only (requires Bearer token + admin email)
- GET  /admin/comments — admin only (requires Bearer token + admin email)
- GET  /admin/chats — admin only (requires Bearer token + admin email)

## SECURITY ARCHITECTURE (Two-Layer)
Implemented March 2026 — replaced raw Google ID trust model.

### Layer 1 — Session Tokens
- On OAuth login, worker generates crypto.randomUUID() token, stores in sessions table with 7-day expiry
- Token returned to client as sessionToken alongside user object
- Client stores token in localStorage as po_session (NOT the Google ID)
- Every authenticated request sends Authorization: Bearer <token>
- Worker validates token via validateToken() helper: checks D1, checks expiry, returns {userId, email, role}
- Expired tokens are deleted from D1 automatically on next use
- Raw Google ID is NEVER trusted from the client

### Layer 2 — Admin Gate
- Admin routes call requireAdmin() which runs both checks in sequence:
  1. validateToken() — must have valid, unexpired session
  2. session.email === ADMIN_EMAIL — must be pocketoregon@gmail.com
- No valid token → 401. Valid token but wrong email → 403.
- X-Admin-Email header is completely gone — was fakeable, now removed

### What changed per file
- worker.js: sessions table logic, validateToken()/requireAuth()/requireAdmin() helpers, all routes updated
- index.html: stores po_session, sends Bearer token for chat/history/comments/delete, calls /auth/logout on sign-out. Redirects to signin.html for login.
- signin.html: Handles Google login, stores po_session, redirects back to source page. Features animated background.
- admin.html: stores po_session, sends Bearer token on all admin fetches, init() requires po_session to exist
- profile.html: stores po_session (login flow updated). **Privacy update: Email hidden from public view.**
- notes/index.html: sends Bearer token for all notes operations, replaced X-User-Id header everywhere, init() requires po_session

## WHAT IS WORKING ✅
- Google OAuth login with session token (7-day expiry)
- Secure sign-out via /auth/logout (token deleted from D1)
- User profile pages at /profile.html?id=USER_ID
- Profile shows: avatar, name, role badge, join date, comment count, chat count, comments
- **Privacy: User emails are only visible to the owner and admins.**
- Comment deletion: users delete own, admin deletes any (both via Bearer token)
- Admin panel: Data tab + Content Editor tab
- Content Editor: edit hero title, hero subtitle, community title, community subtitle
- Content Editor: add/edit/delete homepage cards with page_content field
- Cards load dynamically from D1 (fallback to hardcoded defaults if DB empty)
- Site age auto-calculated on card with date containing "Origin"
- Card titles link to /card/:id (Worker-rendered detail page)
- Card buttons link to /card/:id if page_content exists, else show warning toast
- Worker serves card detail pages at clean URL /card/1 etc.
- AI chat (login required), chat history with date dividers
- Comments with delete buttons, clicking name goes to profile
- "My Profile" and "📝 My Notes" in nav dropdown
- Notes app at /notes — E2E encrypted using AES-GCM (Web Crypto API)
  - Notes encrypted in browser using user's Google ID as key before sending to DB
  - DB stores only ciphertext — server never sees plaintext
  - Create, edit, delete notes
- Loading curtain on homepage (white screen with logo animation, lifts when DB loaded)
- Admin: view users/comments/chats, delete any comment, view profiles
- SEO, Google Search Console verified, sitemap submitted
- Favicon fully set up
- DNS on Cloudflare, HTTP/3 (QUIC) disabled

## ⚠️ DEPLOYMENT RULES — FOLLOW STRICTLY EVERY TIME

### HTML files (index.html, admin.html, profile.html, notes/index.html, signin.html):
- Edit directly in GitHub web editor
- Commit → GitHub Pages auto-deploys in ~2 minutes
- This does NOT affect the worker ✅

### worker.js — SPECIAL PROCEDURE:
1. Edit worker.js in GitHub (keeps repo in sync)
2. Go to Cloudflare → Workers & Pages → po → Edit code
3. Select all → paste new worker.js → Deploy
- GitHub and Cloudflare are DISCONNECTED — GitHub commits do NOT auto-deploy worker
- Worker only updates when you manually paste + deploy in Cloudflare editor
- NEVER reconnect GitHub to the Worker — it causes silent overwrites

### If worker routes stop working:
1. Go to Cloudflare → Workers & Pages → po → Edit code
2. Check if the routes are still there (search for /notes or /cards)
3. If missing — paste the latest worker.js from GitHub and deploy
4. This happens when someone accidentally reconnects GitHub auto-deploy

### When adding new features that touch auth:
- Always use requireAuth() or requireAdmin() helpers — never trust raw headers from client
- Never re-introduce X-User-Id or X-Admin-Email headers — these are gone for security reasons
- Session token is always read from Authorization: Bearer header server-side

## DNS SETUP (IMPORTANT)
- A records for pocketoregon.site → DNS only (grey cloud, NOT proxied)
  - Must stay unproxied — Cloudflare proxy IPs blocked by developer's local ISP
- CNAME www → DNS only (grey cloud)
- Worker api.pocketoregon.site → Proxied (orange cloud) — required for Worker custom domain
- HTTP/3 (QUIC) disabled in Cloudflare Speed → Optimization

## ISP / NETWORK NOTES
- Developer is in Pakistan (Multan)
- Local ISP blocks Cloudflare proxy IPs completely
- api.pocketoregon.site is fully blocked locally (proxied through Cloudflare)
- workers.dev works most of the time, occasionally intermittent GET request issues
- All visitors outside Pakistan have zero issues
- WORKER_URL must stay as workers.dev — api.pocketoregon.site breaks locally

## SEO STATUS
- Google Search Console: verified ✅
- Sitemap submitted ✅
- Verification meta tag in index.html: c2grpbLzoBR-Am_bH3hYVo9qQx82XdOSz6hm2tb-yK0
- robots.txt: allows all except /admin.html

## MOBILE NAV
- Greeting + clock hidden on mobile, shown in hamburger menu
- Nav height: h-14 mobile, h-16 desktop
- Sign in button: icon-only under 400px
- Travelling logo animation disabled on mobile, static logo shown inline

## CLOUDFLARE FREE TIER LIMITS
- Workers AI: ~10,000 neurons/day (~600-700 chat messages)
- Workers requests: 100k/day
- D1 reads: 5M/day
- Resets: midnight UTC

## KNOWN ISSUES / NOTES
- Repo must stay PUBLIC or GitHub Pages breaks
- Google verification meta tag must stay in index.html
- google7b31ba0e9c0ccb1a.html must stay in repo root
- Favicon files must stay in repo ROOT — paths are root-relative
- DNS A records must stay DNS only (not proxied) — proxied breaks site for local ISP
- Worker at api.pocketoregon.site must stay Proxied or Worker custom domain stops working
- site.webmanifest must stay in repo root
- GitHub auto-deploy for Worker is DISCONNECTED — keep it that way
- sessions table must exist in D1 or all logins will fail (created via D1 console SQL)

## NEXT THINGS TO BUILD (planned)
- Chapters page
- Story content / lore pages
- Character profiles
- More admin controls (ban users etc.)
- Update sitemap.xml when new pages added

## NO NODE.JS — all edits via GitHub web editor + Cloudflare dashboard
## EVERYTHING MUST STAY 100% FREE
