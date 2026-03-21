# PocketOregon Site - Full Context File
# Last updated: March 19, 2026 (Added Chapter Info, Characters, World Building, and Books)
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
- notes (id, user_id, title, body, created_at, updated_at) — E2E encrypted
- sessions (token TEXT PRIMARY KEY, user_id, email, expires_at) — 7-day expiry

Story Builder tables:
- stories (id, user_id, title, description, genre, status, created_at, updated_at)
- chapters (id, story_id, title, body, chapter_number, created_at, updated_at)
- story_likes (id, story_id, user_id, created_at) — UNIQUE(story_id, user_id)
- story_bookmarks (id, story_id, user_id, created_at) — UNIQUE(story_id, user_id)

New Advanced Story Features tables:
- chapter_info (id, chapter_id UNIQUE, main_idea, fundamental_theme, extended_synopsis, updated_at)
- characters (id, story_id, name, age, description, hobbies, backstory, personality, motivations, relationships, created_at, updated_at)
- chapter_characters (id, chapter_id, character_id) — UNIQUE(chapter_id, character_id)
- story_world (id, story_id UNIQUE, history, nation, power_system, lore, important_places, updated_at)
- books (id, story_id, name, description, sort_order, created_at, updated_at)
- book_chapters (id, book_id, chapter_id, sequence_order) — UNIQUE(book_id, chapter_id)

## FILES IN REPO
Core site:
- index.html — main site (comments, AI chat, cards, loading curtain, Stories nav link)
- signin.html — dedicated Google sign-in page
- admin.html — admin panel (pocketoregon@gmail.com only)
- profile.html — per-user profile at /profile.html?id=USER_ID
- notes/index.html — private notes app at /notes (E2E encrypted, AES-GCM)

Story Builder:
- stories/index.html — public story browse page
- stories/read.html — story detail page + chapter reader
  - Now includes: Chapters/Books tabs, World button, Chapter Info, Character profiles in chapter
- stories/create.html — Creator Studio (creator/admin only)
  - Now includes: World Building editor, Character Roster management, Books/Volumes management, Chapter Info editor, Character tagging for chapters

Worker & config:
- worker.js — Cloudflare Worker (GitHub for reference ONLY — deployed via Cloudflare editor)
- context.md — this file

## WORKER ROUTES (worker.js)
### Auth
- POST /auth — Google OAuth login → returns { user, sessionToken }
- POST /auth/logout — deletes session token from D1

### User & Profile
- GET /profile?userId= — user profile + comments + chat count

### AI Chat
- POST /chat — AI chatbot (requires Bearer token)
- GET  /chat/history — fetch chat history (requires Bearer token)

### Comments
- GET  /comments?chapter=general — fetch comments (public)
- POST /comments — post comment (requires Bearer token)
- DELETE /comments/:id — delete (own or admin, requires Bearer token)

### Content & Cards
- GET  /content — fetch homepage text blocks (public)
- POST /content — update text block (requires Bearer token + admin)
- GET  /cards — fetch all cards (public)
- POST /cards — add card (requires Bearer token + admin)
- PUT  /cards/:id — update card (requires Bearer token + admin)
- DELETE /cards/:id — delete card (requires Bearer token + admin)
- GET  /card/:id — serves full HTML card detail page (Worker-rendered)

### Notes
- GET  /notes — fetch user's notes (requires Bearer token)
- POST /notes — create note (requires Bearer token)
- PUT  /notes/:id — update note (requires Bearer token, ownership verified)
- DELETE /notes/:id — delete note (requires Bearer token, ownership verified)

### Stories (Basic)
- GET  /stories — list published stories (public)
- GET  /stories/:id — get story + chapters list (public)
- POST /stories — create story (requires Bearer token + creator or admin role)
- PUT  /stories/:id — update story (requires Bearer token + owner or admin)
- DELETE /stories/:id — delete story + all chapters + likes + bookmarks (owner or admin)
- GET  /chapters/:id — get full chapter with prev/next (public)
- POST /stories/:id/chapters — add chapter (requires Bearer token + owner or admin)
- PUT  /chapters/:id — update chapter (requires Bearer token + owner or admin)
- DELETE /chapters/:id — delete chapter (requires Bearer token + owner or admin)
- POST /stories/:id/like — toggle like (requires Bearer token)
- POST /stories/:id/bookmark — toggle bookmark (requires Bearer token)
- GET  /user/bookmarks — get user's bookmarked stories (requires Bearer token)
- GET  /my/stories — get creator's own stories (requires Bearer token + creator or admin)

### Stories (Advanced - NEW)
- GET  /chapters/:id/info — get chapter info (public)
- POST /chapters/:id/info — update chapter info (owner/admin)
- GET  /stories/:id/characters — get story characters (public)
- POST /stories/:id/characters — create character (owner/admin)
- PUT  /characters/:id — update character (owner/admin)
- DELETE /characters/:id — delete character (owner/admin)
- GET  /chapters/:id/characters — get characters tagged to chapter (public)
- POST /chapters/:id/characters — tag character to chapter (owner/admin)
- DELETE /chapters/:id/characters/:charId — untag character (owner/admin)
- GET  /stories/:id/world — get story world data (public)
- POST /stories/:id/world — update story world data (owner/admin)
- GET  /stories/:id/books — get books with chapters (public)
- POST /stories/:id/books — create book (owner/admin)
- PUT  /books/:id — update book (owner/admin)
- DELETE /books/:id — delete book (owner/admin)
- POST /books/:id/chapters — add chapter to book (owner/admin)
- DELETE /books/:id/chapters/:charId — remove chapter from book (owner/admin)

### Admin
- GET  /admin/users — all users (requires Bearer token + admin)
- GET  /admin/comments — all comments (requires Bearer token + admin)
- GET  /admin/chats — all chats (requires Bearer token + admin)
- GET  /admin/stories — all stories including drafts (requires Bearer token + admin)
- PUT  /admin/users/:id/role — change user role (requires Bearer token + admin)

## SECURITY ARCHITECTURE (Two-Layer)
### Layer 1 — Session Tokens
- Client stores in localStorage: po_token (token), po_user (user object)
- Every authenticated request sends: Authorization: Bearer <token>
- Worker validates via validateToken() — checks D1, checks expiry, returns {id, email, name, role}

### Layer 2 — Role-Based Access
- Admin routes: user.role === 'admin'
- Creator routes: user.role === 'creator' || user.role === 'admin'
- Ownership checks: user.id must match resource owner

## DESIGN SYSTEM
- Fonts: Inter (body), Outfit (headings/logo)
- Colors: #1f1e24 (primary), #f97316 (orange accent), #e5e7eb (borders), #f9fafb (surface)

## ⚠️ DEPLOYMENT RULES — FOLLOW STRICTLY EVERY TIME
### HTML files:
- Edit in GitHub repo → Commit → GitHub Pages auto-deploys in ~2 minutes
### worker.js — SPECIAL MANUAL PROCEDURE:
1. Edit worker.js in GitHub (keeps repo history in sync)
2. Go to Cloudflare → Workers & Pages → po → Edit code
3. Select all → paste entire new worker.js → Deploy
- GitHub commits do NOT auto-deploy the worker

## DNS SETUP
- A records for pocketoregon.site → DNS only (grey cloud, NOT proxied)
- Worker api.pocketoregon.site → Proxied (orange cloud)

## ISP / NETWORK NOTES
- api.pocketoregon.site is fully blocked locally in Pakistan (proxied through Cloudflare)
- WORKER_URL must always be https://po.pocketoregon.workers.dev

## Recent Changes (March 21, 2026)
- **World Building — Hide Tabs & Subtabs**:
  - Added ability for creators to hide specific world tabs from readers.
  - Introduced subtabs within world tabs, allowing for better organization of lore (e.g., "Nations" tab with subtabs for each country).
  - Subtabs can also be individually hidden or visible to readers.
  - Added a "Merge and turn off" feature that safely merges subtab content back into the main tab when subtabs are disabled.
  - Updated reader view (`stories/read.html`) to filter out hidden tabs and subtabs, and added a subtab navigation bar for lore-heavy sections.
  - Implemented data migration in `loadWorld()` to ensure existing world data is compatible with the new structure.
