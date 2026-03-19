# Project Context

## Overview
- **Repository**: pocketoregon/po
- **Website**: Static site hosted on GitHub Pages
- **Backend**: Cloudflare Worker
- **Database**: Cloudflare D1

## Worker Information
- **URL**: https://po.pocketoregon.workers.dev
- **Auth Pattern**: Every request sends header: `Authorization: Bearer <token>`
- **Token Storage**: `localStorage` as `po_token`

## Notes System
- **E2E Encryption**: AES-GCM via Web Crypto API
- **Fields**:
  - `note.title`: Encrypted
  - `note.body`: Encrypted
  - `note.tags`: Encrypted
  - `note.pinned`: Plain integer (0 or 1)

## Worker Endpoints
- `GET /notes`: Returns array of notes for logged-in user
- `POST /notes`: Creates note, body: `{title, body, tags, pinned}`
- `PUT /notes/:id`: Updates note, body: `{title, body, tags, pinned}`
- `DELETE /notes/:id`: Deletes note

## Design System
- **Font body**: Inter
- **Font headings**: Outfit
- **Primary color**: `#1f1e24`
- **Accent/orange**: `#f97316`
- **Border color**: `#e5e7eb`
- **Background**: `#f9fafb`
- **Card background**: white
- **Border radius**: cards (8px), inputs (6px)
- **Buttons**: background `#1f1e24`, color white, border-radius 6px

## Recent Changes (March 19, 2026)
Implemented 12 new features:
1. Markdown Rendering (marked.js)
2. Formatting Toolbar in Editor
3. Tags Support (Encrypted)
4. Pin Notes (Pinned notes sort to top)
5. Real-time Search
6. Client-side Sorting (Newest, Oldest, A-Z, Z-A, Longest)
7. List / Grid View Toggle (Persisted in localStorage)
8. Live Word/Char Count in Editor
9. Full-screen Writing Mode
10. Export Note as .md File
11. Dark Mode (Persisted in localStorage)
12. Keyboard Shortcuts (Ctrl/Cmd+S, Ctrl/Cmd+N, Esc, Ctrl/Cmd+P)
