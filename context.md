# PocketOregon Site - Full Context File
# Last updated: March 18, 2026 (Card link_url, Creator Studio dashboard, profile link fixes)
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

## USER ROLE SYSTEM
Three roles exist in the users table:

| Role    | What They Can Do |
|---------|-----------------|
| reader  | Browse + read published stories, like, bookmark, comment, use AI chat |
| creator | Everything reader can + create/edit/delete own stories and chapters |
| admin   | Everything creator can + delete ANY story, manage all users, access admin panel |

Role upgrade flow:
- Only admin (pocketoregon@gmail.com) can change roles
- Admin goes to admin.html → Data tab → Users table → clicks "Make Creator" or "Make Reader"
- Calls PUT /admin/users/:id/role in the worker
- New users always start as 'reader' by default
- After role change: user must sign out and back in to see changes (role is cached in localStorage)
- Admin account hardcoded to role='admin' on first login via ADMIN_EMAIL check in /auth route

IMPORTANT: Readers blocked from Creator Studio at two levels:
1. Frontend: stories/create.html checks role on load — shows "Creator Access Required" page to non-creators
2. Backend: worker POST /stories returns 403 if role is not 'creator' or 'admin'

## DATABASE TABLES (D1)
Existing tables:
- users (id, email, name, role, created_at) — role is 'reader', 'creator', or 'admin'
- chat_history (id, user_id, message, reply, created_at)
- comments (id, user_id, chapter, text, created_at)
- content (key, value, updated_at) — homepage text blocks + AI system instruction
- cards (id, title, body, date, link_text, link_url, sort_order, page_content, created_at)
  - link_text: button label shown on card (leave blank = no button)
  - link_url: URL the button links to (leave blank = no button)
  - Both link_text AND link_url must be set for button to appear on homepage
- notes (id, user_id, title, body, created_at, updated_at) — E2E encrypted
- sessions (token TEXT PRIMARY KEY, user_id, email, expires_at) — 7-day expiry

Story Builder tables:
- stories (id, user_id, title, description, genre, status, created_at, updated_at)
  - status: 'draft' or 'published'
  - genre: General, Fantasy, Sci-Fi, Romance, Thriller, Mystery, Horror, Adventure
- chapters (id, story_id, title, body, chapter_number, created_at, updated_at)
- story_likes (id, story_id, user_id, created_at) — UNIQUE(story_id, user_id)
- story_bookmarks (id, story_id, user_id, created_at) — UNIQUE(story_id, user_id)

## FILES IN REPO
Core site:
- index.html — main site (comments, AI chat, cards, loading curtain, Stories nav link)
- signin.html — dedicated Google sign-in page with animated dark background
- admin.html — admin panel (pocketoregon@gmail.com only)
  - Tabs: Data (Users + Comments + Chats) | Stories | Content Editor
  - Users table: Make Creator / Make Reader buttons + View profile link using ?id=
  - Cards editor: supports link_text + link_url fields for full button control
  - Role change message tells admin user must re-login to see changes
- profile.html — per-user profile at /profile.html?id=USER_ID (email hidden from public)
- notes/index.html — private notes app at /notes (E2E encrypted, AES-GCM)

Story Builder:
- stories/index.html — public story browse page with genre filters, like/bookmark
- stories/read.html — story detail page + chapter reader (prev/next navigation)
- stories/create.html — Creator Studio (creator/admin only)
  - Landing page: dashboard showing all creator's stories with Edit/View buttons
  - New Story button opens blank editor form
  - Editing: loads story + chapters, URL updates to ?id=STORY_ID without page reload
  - Ownership check: shows error if trying to edit another user's story
  - Browser back/forward navigation works correctly

Worker & config:
- worker.js — Cloudflare Worker (GitHub for reference ONLY — deployed via Cloudflare editor)
- wrangler.toml — worker config (reference only)
- CNAME — pocketoregon.site
- sitemap.xml — SEO sitemap
- robots.txt — blocks /admin.html from Google
- google7b31ba0e9c0ccb1a.html — Google Search Console verification (never delete)
- site.webmanifest — PWA manifest (name: "PocketOregon")
- favicon.ico, favicon.svg, favicon-96x96.png, apple-touch-icon.png — favicons
- web-app-manifest-192x192.png, web-app-manifest-512x512.png — PWA icons
- context.md — this file

## WORKER ROUTES (worker.js)
### Auth
- POST /auth — Google OAuth login → returns { user, sessionToken }
- POST /auth/logout — deletes session token from D1

### User & Profile
- GET /profile?userId= — user profile + comments + chat count (public, email hidden unless self/admin)

### AI Chat
- POST /chat — AI chatbot (requires Bearer token, dynamic system prompt from DB)
- GET  /chat/history — fetch chat history (requires Bearer token)

### Comments
- GET  /comments?chapter=general — fetch comments (public)
- POST /comments — post comment (requires Bearer token)
- DELETE /comments/:id — delete (own or admin, requires Bearer token)

### Content & Cards
- GET  /content — fetch homepage text blocks (public)
- POST /content — update text block (requires Bearer token + admin)
- GET  /cards — fetch all cards (public) — returns link_url field
- POST /cards — add card (requires Bearer token + admin) — accepts link_url
- PUT  /cards/:id — update card (requires Bearer token + admin) — accepts link_url
- DELETE /cards/:id — delete card (requires Bearer token + admin)
- GET  /card/:id — serves full HTML card detail page (Worker-rendered)

### Notes
- GET  /notes — fetch user's notes (requires Bearer token)
- POST /notes — create note (requires Bearer token)
- PUT  /notes/:id — update note (requires Bearer token, ownership verified)
- DELETE /notes/:id — delete note (requires Bearer token, ownership verified)

### Stories
- GET  /stories — list published stories (public, ?genre= and ?author= filters)
- GET  /stories/:id — get story + chapters list (public; draft = owner/admin only)
- POST /stories — create story (requires Bearer token + creator or admin role)
- PUT  /stories/:id — update story (requires Bearer token + owner or admin)
- DELETE /stories/:id — delete story + all chapters + likes + bookmarks (owner or admin)
- GET  /chapters/:id — get full chapter with prev/next (public; draft parent = owner/admin only)
- POST /stories/:id/chapters — add chapter (requires Bearer token + owner or admin)
- PUT  /chapters/:id — update chapter (requires Bearer token + owner or admin)
- DELETE /chapters/:id — delete chapter (requires Bearer token + owner or admin)
- POST /stories/:id/like — toggle like (requires Bearer token)
- POST /stories/:id/bookmark — toggle bookmark (requires Bearer token)
- GET  /user/bookmarks — get user's bookmarked stories (requires Bearer token)
- GET  /my/stories — get creator's own stories including drafts (requires Bearer token + creator or admin)

### Admin
- GET  /admin/users — all users (requires Bearer token + admin)
- GET  /admin/comments — all comments (requires Bearer token + admin)
- GET  /admin/chats — all chats (requires Bearer token + admin)
- GET  /admin/stories — all stories including drafts (requires Bearer token + admin)
- PUT  /admin/users/:id/role — change user role (requires Bearer token + admin; cannot change own role)

## SECURITY ARCHITECTURE (Two-Layer)
### Layer 1 — Session Tokens
- On OAuth login, worker generates crypto.randomUUID() token, stores in sessions with 7-day expiry
- Token returned as sessionToken alongside user object
- Client stores in localStorage: po_token (token), po_user (user object)
- Every authenticated request sends: Authorization: Bearer <token>
- Worker validates via validateToken() — checks D1, checks expiry, returns {id, email, name, role}
- Expired tokens deleted from D1 automatically on next use
- Raw Google ID tokens are NEVER trusted from the client

### Layer 2 — Role-Based Access
- Admin routes: user.role === 'admin'
- Creator routes: user.role === 'creator' || user.role === 'admin'
- Ownership checks: user.id must match resource owner (stories, chapters, notes, comments)

## AUTH PATTERN (used in all HTML files)
```javascript
function getToken() { return localStorage.getItem('po_token') || ''; }
function authHeaders() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }; }
```

## PROFILE LINK PATTERN
All files use: /profile.html?id=USER_ID
Never use: /profile.html?userId=USER_ID (old broken pattern — fixed in all files)

## CARD BUTTON SYSTEM
- Admin sets link_text (button label) AND link_url (destination) in Content Editor
- Both must be non-empty for button to appear on homepage
- URL can be internal (e.g. /stories/) or external (e.g. https://...)
- index.html renders: <a href="${link_url}">${link_text}</a> when both are set
- No button shown if either field is blank
- Old "i warn you don't click it" behaviour is completely removed

## DESIGN SYSTEM
- Fonts: Inter (body), Outfit (headings/logo)
- Colors: #1f1e24 (primary), #f97316 (orange accent), #e5e7eb (borders), #f9fafb (surface)
- Loading curtain: white overlay that lifts up (translateY(-100%)) after content loads
- Toast: dark pill bottom center (stories pages) or fixed top center alert (admin/index)
- Story cover colors: ['#fde8e8','#e8f4fd','#e8fdf0','#fdf6e8','#f0e8fd','#fde8f6'] by story.id % 6

## WHAT IS WORKING ✅
- Google OAuth login with 7-day session tokens
- Secure sign-out via /auth/logout
- Role system: reader / creator / admin
- Admin can promote/demote users — user must re-login to see role change
- Profile links use ?id= correctly in all files (admin, stories/index, stories/read, stories/create)
- Comments: post, delete own, admin deletes any
- Admin panel: Users (role buttons) + Stories tab + Content Editor
- AI chatbot with dynamic system prompt (editable from admin)
- Notes app — E2E encrypted (AES-GCM)
- Story Builder: browse, read, creator studio with dashboard
- Creator Studio: shows all creator's stories on load, edit/new without page reload
- Story ownership protection: cannot edit another user's story (frontend + backend)
- Card button system: admin sets link_text + link_url, full control over button behaviour
- Homepage: dynamic cards/content, AI chat, loading curtain, Stories nav link

## ⚠️ DEPLOYMENT RULES — FOLLOW STRICTLY EVERY TIME

### HTML files:
- Edit in GitHub repo → Commit → GitHub Pages auto-deploys in ~2 minutes

### worker.js — SPECIAL MANUAL PROCEDURE:
1. Edit worker.js in GitHub (keeps repo history in sync)
2. Go to Cloudflare → Workers & Pages → po → Edit code
3. Select all → paste entire new worker.js → Deploy
- GitHub commits do NOT auto-deploy the worker
- Worker only updates when manually pasted + deployed in Cloudflare editor

### Database schema changes:
- Go to Cloudflare → D1 → pocketoregon-db → Console
- Run SQL directly in the console

## DNS SETUP
- A records for pocketoregon.site → DNS only (grey cloud, NOT proxied)
- Worker api.pocketoregon.site → Proxied (orange cloud)
- HTTP/3 (QUIC) disabled in Cloudflare Speed → Optimization

## ISP / NETWORK NOTES
- api.pocketoregon.site is fully blocked locally in Pakistan (proxied through Cloudflare)
- WORKER_URL must always be https://po.pocketoregon.workers.dev

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
