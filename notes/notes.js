import { initNavDrawer, openNavDrawer, updateNavDrawerUser } from '/nav-drawer.js';

    // Inline onclick="" attributes run in global scope, not module scope —
    // every function referenced by an onclick/onchange in the HTML above
    // must be explicitly exposed on window.
    window.openLoginModal = openLoginModal;
    window.toggleDarkMode = toggleDarkMode;
    window.closeEditor = closeEditor;
    window.toggleFullscreen = toggleFullscreen;
    window.formatText = formatText;
    window.formatInlineCode = formatInlineCode;
    window.formatCodeBlock = formatCodeBlock;
    window.insertChecklist = insertChecklist;
    window.insertLink = insertLink;
    window.closeLinkDialog = closeLinkDialog;
    window.confirmLinkDialog = confirmLinkDialog;
    window.openNewNote = openNewNote;
    window.handleSort = handleSort;
    window.switchView = switchView;
    window.openEditNote = openEditNote;
    window.togglePin = togglePin;
    window.deleteNote = deleteNote;
    window.exportNote = exportNote;
    window.finishEditing = finishEditing;
    window.toggleTagFilter = toggleTagFilter;
    window.clearSearch = clearSearch;
    window.selectSort = selectSort;
    window.openNavDrawer = openNavDrawer;
    window.signOut = signOut;

    const WORKER_URL = 'https://api.pocketoregon.site';
    const GOOGLE_CLIENT_ID = '930005975840-u809k2ldaa6cug4jm82tafb5vahoou4h.apps.googleusercontent.com';

    let currentUser = null;
    let googleReady = false;
    let notes = [];
    let filteredNotes = [];
    let editingNoteId = null;
    let cryptoKey = null;
    let currentTab = 'write';
    let currentView = 'grid';
    let currentSort = 'newest';
    let selectedTag = null;
    let isFullscreen = false;
    let linkDialogSelectionRange = null;
    let autosaveTimer = null;
    let autosaveFirstChangeAt = null;
    let isSavingNow = false;
    let lastSavedSnapshot = null;
    const AUTOSAVE_DEBOUNCE_MS = 1800;  // wait this long after the last keystroke
    const AUTOSAVE_MAX_WAIT_MS = 8000;  // ...but never wait longer than this since the first unsaved change

    // ── LOADING CURTAIN ──────────────────────────────────────────────
    function liftCurtain() {
        const c = document.getElementById('loading-curtain');
        if (!c) return;
        c.classList.add('lift');
        setTimeout(() => c.remove(), 650);
    }
    setTimeout(liftCurtain, 3500);

    // ── SESSION HELPER ───────────────────────────────────────────────
    function authHeader() {
        // Auth now flows via the po_token HttpOnly cookie, sent automatically
        // by the browser when credentials:'include' is set on each fetch.
        return {};
    }

    // ── DARK MODE ────────────────────────────────────────────────────
    function initDarkMode() {
        const isDark = localStorage.getItem('po_notes_dark') === 'true';
        if (isDark) document.body.classList.add('dark');
        updateDarkModeButton();
    }

    function toggleDarkMode() {
        const checkbox = document.getElementById('dark-mode-checkbox');
        document.body.classList.toggle('dark', checkbox.checked);
        localStorage.setItem('po_notes_dark', checkbox.checked);
    }

    function updateDarkModeButton() {
        const checkbox = document.getElementById('dark-mode-checkbox');
        if (checkbox) checkbox.checked = document.body.classList.contains('dark');
    }

    // ── UNIVERSAL NAV DRAWER ─────────────────────────────────────────
    function updateNavAvatar(user) {
        const area = document.getElementById('nav-user-area');
        const avatar = document.getElementById('nav-user-avatar');
        if (user) {
            const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
            avatar.textContent = initials;
            area.style.display = 'flex';
        } else {
            area.style.display = 'none';
        }
    }

    function signOut() {
        fetch(WORKER_URL + '/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        currentUser = null;
        cryptoKey = null;
        notes = [];
        filteredNotes = [];
        localStorage.removeItem('po_user');
        document.getElementById('app').style.display = 'none';
        document.getElementById('gate').style.display = 'flex';
        updateNavAvatar(null);
        showAlert('Signed out successfully.');
    }

    // Bridge universal drawer sign-out event to this page's own sign-out logic
    window.addEventListener('nav-drawer-signout', () => {
        signOut();
    });

    // ── GOOGLE AUTH ──────────────────────────────────────────────────
    function waitForGoogle() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleLogin, use_fedcm_for_prompt: false });
            googleReady = true;
        } else { setTimeout(waitForGoogle, 100); }
    }
    waitForGoogle();

    function openLoginModal() {
        document.getElementById('login-modal').classList.add('open');
        const container = document.getElementById('google-btn-container');
        container.innerHTML = '';
        const tryRender = () => {
            if (googleReady) { google.accounts.id.renderButton(container, { type:'standard', theme:'outline', size:'large', width:280 }); }
            else { setTimeout(tryRender, 150); }
        };
        tryRender();
    }

    function handleGoogleLogin(response) {
        document.getElementById('login-modal').classList.remove('open');
        fetch(WORKER_URL + '/auth', { method:'POST', credentials: 'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token:response.credential}) })
        .then(r => r.json())
        .then(async data => {
            if (data.user) {
                currentUser = data.user;
                localStorage.setItem('po_user', JSON.stringify(data.user));
                await initCryptoKey(data.user);
                initNavDrawer(data.user);
                updateNavAvatar(data.user);
                showApp();
            } else { showAlert('Login failed. Try again.'); }
        })
        .catch(() => showAlert('Login failed. Try again.'));
    }

    // ── E2E ENCRYPTION (AES-GCM via Web Crypto API) ──────────────────
    async function initCryptoKey(user) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(String(user.id).padEnd(32, '0').slice(0, 32)),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
        cryptoKey = keyMaterial;
    }

    async function encrypt(text) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        return btoa(String.fromCharCode(...combined));
    }

    async function decrypt(b64) {
        try {
            const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
            return new TextDecoder().decode(decrypted);
        } catch(e) { return '[Could not decrypt]'; }
    }

    // ── APP ──────────────────────────────────────────────────────────
    async function showApp() {
        document.getElementById('gate').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        initDarkMode();
        liftCurtain();
        await loadNotes();
    }

    async function loadNotes() {
        try {
            const res = await fetch(WORKER_URL + '/notes', {
                credentials: 'include',
                headers: authHeader()
            });
            if (res.status === 401) {
                currentUser = null;
                cryptoKey = null;
                localStorage.removeItem('po_user');
                document.getElementById('app').style.display = 'none';
                document.getElementById('gate').style.display = 'flex';
                liftCurtain();
                return;
            }
            const data = await res.json();
            const raw = data.notes || [];
            notes = await Promise.all(raw.map(async n => ({
                ...n,
                title: await decrypt(n.title),
                body: await decrypt(n.body),
                tags: await decrypt(n.tags)
            })));
            filteredNotes = [...notes];
            renderFilterTags();
            applySort();
            renderNotes();
        } catch(e) {
            showAlert('Could not load notes.');
            liftCurtain();
        }
    }

    function renderFilterTags() {
        const allTags = new Set();
        notes.forEach(n => {
            if (n.tags) {
                n.tags.split(',').forEach(t => {
                    const tag = t.trim();
                    if (tag) allTags.add(tag);
                });
            }
        });
        const container = document.getElementById('filter-tags');
        container.innerHTML = Array.from(allTags).sort().map(tag => `
            <button class="tag-pill ${selectedTag === tag ? 'active' : ''}" onclick="toggleTagFilter('${escHtml(tag)}')">${escHtml(tag)}</button>
        `).join('');
    }

    function toggleTagFilter(tag) {
        selectedTag = selectedTag === tag ? null : tag;
        applyFilters();
        renderFilterTags();
        renderNotes();
    }

    function applyFilters() {
        let result = [...notes];
        
        // Search filter
        const searchTerm = document.getElementById('notes-search').value.toLowerCase();
        if (searchTerm) {
            result = result.filter(n => 
                (n.title || '').toLowerCase().includes(searchTerm) ||
                (n.body || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Tag filter
        if (selectedTag) {
            result = result.filter(n => {
                if (!n.tags) return false;
                return n.tags.split(',').map(t => t.trim()).includes(selectedTag);
            });
        }
        
        filteredNotes = result;
        updateSearchResultCount();
    }

    function updateSearchResultCount() {
        const searchTerm = document.getElementById('notes-search').value.trim();
        const count = document.getElementById('search-result-count');
        if (searchTerm) {
            count.textContent = `Showing ${filteredNotes.length} of ${notes.length} notes`;
            count.style.display = 'block';
        } else {
            count.style.display = 'none';
        }
    }

    function clearSearch() {
        document.getElementById('notes-search').value = '';
        document.getElementById('search-clear').style.display = 'none';
        applyFilters();
        renderNotes();
    }

    function applySort() {
        const sortType = currentSort;
        let sorted = [...filteredNotes];
        
        // Pinned notes always first
        const pinned = sorted.filter(n => n.pinned);
        const unpinned = sorted.filter(n => !n.pinned);
        
        if (sortType === 'newest') {
            unpinned.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        } else if (sortType === 'oldest') {
            unpinned.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
        } else if (sortType === 'a-z') {
            unpinned.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (sortType === 'z-a') {
            unpinned.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        } else if (sortType === 'longest') {
            unpinned.sort((a, b) => (b.body || '').split(/\s+/).length - (a.body || '').split(/\s+/).length);
        }
        
        filteredNotes = [...pinned, ...unpinned];
    }

    function handleSort() {
        currentSort = document.getElementById('notes-sort').value;
        applySort();
        renderNotes();
    }

    function selectSort(value, label) {
        currentSort = value;
        document.getElementById('sort-trigger-label').textContent = label;
        document.getElementById('sort-toggle').checked = false;
        document.querySelectorAll('#sort-dropdown .article').forEach(btn => {
            btn.classList.toggle('selected', btn.getAttribute('data-value') === value);
        });
        applySort();
        renderNotes();
    }

    function switchView(view) {
        currentView = view;
        localStorage.setItem('po_notes_view', view);
        document.getElementById('grid-view-btn').classList.toggle('active', view === 'grid');
        document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
        renderNotes();
    }

    function renderNotes(skipAnimation) {
        const grid = document.getElementById('notes-grid');
        const list = document.getElementById('notes-list');
        const empty = document.getElementById('empty-state');
        const count = document.getElementById('notes-count');
        grid.classList.toggle('no-anim', !!skipAnimation);
        list.classList.toggle('no-anim', !!skipAnimation);
        
        count.textContent = filteredNotes.length === 0 ? 'No notes yet' : `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`;
        
        if (filteredNotes.length === 0) { 
            grid.innerHTML = ''; 
            list.innerHTML = '';
            empty.style.display = 'block'; 
            return; 
        }
        empty.style.display = 'none';
        
        if (currentView === 'grid') {
            list.style.display = 'none';
            grid.style.display = 'grid';
            grid.innerHTML = filteredNotes.map(n => renderNoteCard(n)).join('');
        } else {
            grid.style.display = 'none';
            list.style.display = 'flex';
            list.innerHTML = filteredNotes.map(n => renderNoteListItem(n)).join('');
        }
    }

    function renderNoteCard(n) {
        const preview = stripHtml(n.body || '').substring(0, 130);
        const tagsHtml = n.tags ? n.tags.split(',').map(t => {
            const tag = t.trim();
            return tag ? `<span class="note-tag-chip-3d">${escHtml(tag)}</span>` : '';
        }).join('') : '';
        const d = n.updated_at ? new Date(n.updated_at) : null;
        const month = d ? d.toLocaleDateString([], { month: 'short' }).toUpperCase() : '';
        const day = d ? d.getDate() : '';

        return `
            <div class="note-card-3d" onclick="openEditNote(${n.id})">
                <div class="note-card-face ${n.pinned ? 'is-pinned' : ''}">
                    <div class="note-card-topband"></div>
                    <div class="note-date-badge"><span class="month">${month}</span><span class="day">${day}</span></div>
                    <div class="note-content-box">
                        <div class="note-card-title-3d">${escHtml(n.title || 'Untitled')}</div>
                        <div class="note-card-preview-3d">${escHtml(preview)}</div>
                        ${tagsHtml ? `<div class="note-tags-3d">${tagsHtml}</div>` : ''}
                        <div class="note-card-actions-3d">
                            <button class="nc-action-btn nc-open" onclick="event.stopPropagation(); openEditNote(${n.id})" title="Open note">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </button>
                            <label class="pin-toggle pin-toggle-3d" onclick="event.stopPropagation()" title="${n.pinned ? 'Unpin' : 'Pin'} note">
                                <input type="checkbox" ${n.pinned ? 'checked' : ''} onclick="togglePin(event, ${n.id})">
                                <span class="pin-toggle-box">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z"/></svg>
                                </span>
                            </label>
                            <button class="nc-action-btn nc-delete" onclick="deleteNote(event, ${n.id})" title="Delete note">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderNoteListItem(n) {
        const preview = stripHtml(n.body || '').substring(0, 60);
        const tagsText = n.tags ? n.tags.split(',').map(t => t.trim()).filter(Boolean).join(', ') : '';
        
        return `
            <div class="note-list-item ${n.pinned ? 'pinned' : ''}" onclick="openEditNote(${n.id})">
                <div class="note-list-title">${escHtml(n.title || 'Untitled')}</div>
                <div class="note-list-body">${escHtml(preview)}</div>
                <div class="note-list-tags">${escHtml(tagsText)}</div>
                <div class="note-list-date">${formatDate(n.updated_at)}</div>
                <div class="note-list-actions">
                    <label class="pin-toggle pin-toggle-list" onclick="event.stopPropagation()" title="${n.pinned ? 'Unpin' : 'Pin'} note">
                        <input type="checkbox" ${n.pinned ? 'checked' : ''} onclick="togglePin(event, ${n.id})">
                        <span class="pin-toggle-box">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z"/></svg>
                        </span>
                    </label>
                    <button class="note-list-del-btn" onclick="deleteNote(event, ${n.id})" title="Delete note">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    function stripHtml(html) {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function openNewNote() {
        editingNoteId = null;
        document.getElementById('editor-title').value = '';
        document.getElementById('editor-body').innerHTML = '';
        document.getElementById('editor-tags').value = '';
        document.getElementById('editor-meta').textContent = 'New note';
        document.getElementById('save-btn').textContent = 'Done';
        document.getElementById('editor-modal').classList.add('open');
        document.body.classList.add('modal-open');
        updateWordCount();
        updateToolbarState();
        lastSavedSnapshot = null;
        autosaveFirstChangeAt = null;
        setSaveStatus('', '');
        checkForDraft();
        setTimeout(() => document.getElementById('editor-title').focus(), 100);
    }

    function openEditNote(noteId) {
        const note = filteredNotes.find(n => n.id === noteId);
        if (!note) return;
        editingNoteId = noteId;
        document.getElementById('editor-title').value = note.title || '';
        document.getElementById('editor-body').innerHTML = note.body || '';
        document.getElementById('editor-tags').value = note.tags || '';
        document.getElementById('editor-meta').textContent = 'Last edited ' + formatDate(note.updated_at);
        document.getElementById('save-btn').textContent = 'Done';
        document.getElementById('editor-modal').classList.add('open');
        document.body.classList.add('modal-open');
        updateWordCount();
        updateToolbarState();
        lastSavedSnapshot = { title: note.title || '', body: note.body || '', tags: note.tags || '' };
        autosaveFirstChangeAt = null;
        setSaveStatus('', '');
        checkForDraft();
        setTimeout(() => document.getElementById('editor-body').focus(), 100);
    }

    function closeEditor() {
        if (isFullscreen) {
            toggleFullscreen();
            return;
        }
        if (autosaveTimer) { clearTimeout(autosaveTimer); performAutosave(); }
        document.getElementById('editor-modal').classList.remove('open');
        document.body.classList.remove('modal-open');
        editingNoteId = null;
        isFullscreen = false;
        autosaveFirstChangeAt = null;
    }


    function ensureEditorFocused() {
        const editor = document.getElementById('editor-body');
        if (document.activeElement !== editor) editor.focus();
        try { document.execCommand('AutoUrlDetect', false, false); } catch(e) {}
    }

    function updateToolbarState() {
        try {
            const boldBtn = document.getElementById('btn-bold');
            const italicBtn = document.getElementById('btn-italic');
            const h1Btn = document.getElementById('btn-h1');
            const h2Btn = document.getElementById('btn-h2');
            if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
            if (italicBtn) italicBtn.classList.toggle('active', document.queryCommandState('italic'));
            const block = (document.queryCommandValue('formatBlock') || '').toLowerCase();
            if (h1Btn) h1Btn.classList.toggle('active', block === 'h1');
            if (h2Btn) h2Btn.classList.toggle('active', block === 'h2');
        } catch(e) {}
    }

    function formatText(command, value) {
        ensureEditorFocused();
        document.execCommand(command, false, value || null);
        updateWordCount();
        updateToolbarState();
    }

    function placeCaretAtEndOf(selector) {
        const editor = document.getElementById('editor-body');
        const nodes = editor.querySelectorAll(selector);
        const last = nodes[nodes.length - 1];
        if (!last) return;
        const range = document.createRange();
        range.selectNodeContents(last);
        range.collapse(false);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
    }

    function formatInlineCode() {
        ensureEditorFocused();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const text = sel.toString();
            document.execCommand('insertHTML', false, '<code>' + escHtml(text) + '</code>');
        } else {
            document.execCommand('insertHTML', false, '<code>\u200b</code>');
            placeCaretAtEndOf('code');
        }
        updateWordCount();
    }

    function formatCodeBlock() {
        ensureEditorFocused();
        const sel = window.getSelection();
        const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;
        const text = hasSelection ? sel.toString() : '';
        document.execCommand('insertHTML', false, '<pre><code>' + (text ? escHtml(text) : '\u200b') + '</code></pre><br>');
        if (!hasSelection) placeCaretAtEndOf('pre code');
        updateWordCount();
    }

    function insertChecklist() {
        ensureEditorFocused();
        document.execCommand('insertHTML', false, '<input type="checkbox" contenteditable="false"> ');
        updateWordCount();
    }

    function insertLink() {
        ensureEditorFocused();
        const sel = window.getSelection();
        linkDialogSelectionRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
        document.getElementById('link-dialog-input').value = '';
        document.getElementById('link-dialog').classList.add('open');
        setTimeout(() => document.getElementById('link-dialog-input').focus(), 50);
    }

    function closeLinkDialog() {
        document.getElementById('link-dialog').classList.remove('open');
        linkDialogSelectionRange = null;
    }

    function confirmLinkDialog() {
        const url = document.getElementById('link-dialog-input').value.trim();
        closeLinkDialog();
        if (!url) return;
        const editor = document.getElementById('editor-body');
        editor.focus();
        const sel = window.getSelection();
        if (linkDialogSelectionRange) {
            sel.removeAllRanges();
            sel.addRange(linkDialogSelectionRange);
        }
        const hasSelection = sel && sel.toString().length > 0;
        if (hasSelection) {
            document.execCommand('createLink', false, url);
        } else {
            document.execCommand('insertHTML', false, '<a href="' + escHtml(url) + '" target="_blank">' + escHtml(url) + '</a>');
        }
        updateWordCount();
    }

    function updateWordCount() {
        const body = document.getElementById('editor-body').innerText;
        const words = body.trim().split(/\s+/).filter(Boolean).length;
        const chars = body.length;
        document.getElementById('editor-meta').textContent = `${words} words · ${chars} chars`;
    }

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
        const box = document.querySelector('.editor-box');
        const btn = document.getElementById('fullscreen-btn');
        
        if (isFullscreen) {
            box.classList.add('fullscreen');
            btn.textContent = '⊡';
        } else {
            box.classList.remove('fullscreen');
            btn.textContent = '⛶';
        }
    }

    function exportNote() {
        const title = document.getElementById('editor-title').value || 'note';
        const body = document.getElementById('editor-body').innerText;
        const content = `# ${title}\n\n${body}`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title.toLowerCase().replace(/\s+/g, '-') + '.md';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function togglePin(e, noteId) {
        e.stopPropagation();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        try {
            const res = await fetch(`${WORKER_URL}/notes/${noteId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ 
                    title: await encrypt(note.title || 'Untitled'),
                    body: await encrypt(note.body || ''),
                    tags: await encrypt(note.tags || ''),
                    pinned: note.pinned ? 0 : 1
                })
            });
            const data = await res.json();
            if (data.success) {
                note.pinned = note.pinned ? 0 : 1;
                applySort();
                renderNotes(true);
                showAlert(note.pinned ? 'Note pinned.' : 'Note unpinned.');
            }
        } catch(e) { showAlert('Error updating note.'); }
    }

    async function saveNote() {
        const titleRaw = document.getElementById('editor-title').value.trim();
        const bodyRaw = document.getElementById('editor-body').innerHTML.trim();
        const tagsRaw = document.getElementById('editor-tags').value.trim();
        if (!titleRaw && !bodyRaw) { showAlert('Note is empty.'); return; }

        const btn = document.getElementById('save-btn');
        btn.disabled = true; btn.textContent = 'Saving...';

        try {
            const encTitle = await encrypt(titleRaw || 'Untitled');
            const encBody = await encrypt(bodyRaw);
            const encTags = await encrypt(tagsRaw);

            if (editingNoteId) {
                const res = await fetch(`${WORKER_URL}/notes/${editingNoteId}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({ title: encTitle, body: encBody, tags: encTags, pinned: notes.find(n => n.id === editingNoteId)?.pinned || 0 })
                });
                const data = await res.json();
                if (data.success) {
                    const idx = notes.findIndex(n => n.id === editingNoteId);
                    if (idx !== -1) { 
                        notes[idx].title = titleRaw || 'Untitled'; 
                        notes[idx].body = bodyRaw; 
                        notes[idx].tags = tagsRaw;
                        notes[idx].updated_at = new Date().toISOString(); 
                    }
                    closeEditor(); 
                    applyFilters();
                    applySort();
                    renderFilterTags();
                    renderNotes(); 
                    showAlert('Note saved.');
                } else { showAlert(data.error || 'Save failed.'); }
            } else {
                const res = await fetch(`${WORKER_URL}/notes`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({ title: encTitle, body: encBody, tags: encTags, pinned: 0 })
                });
                const data = await res.json();
                if (data.success) {
                    const newNote = {
                        id: data.id,
                        user_id: currentUser.id,
                        title: titleRaw || 'Untitled',
                        body: bodyRaw,
                        tags: tagsRaw,
                        pinned: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    notes.unshift(newNote);
                    closeEditor();
                    applyFilters();
                    applySort();
                    renderFilterTags();
                    renderNotes();
                    showAlert('Note created.');
                } else { showAlert(data.error || 'Create failed.'); }
            }
        } catch(e) { showAlert('Error saving note.'); }
        btn.disabled = false; btn.textContent = 'Save';
    }

    // ── AUTOSAVE + LOCAL DRAFT BACKUP ─────────────────────────────────
    function draftKey() {
        return 'po_draft_' + (editingNoteId || 'new');
    }

    function currentFormSnapshot() {
        return {
            title: document.getElementById('editor-title').value,
            body: document.getElementById('editor-body').innerHTML,
            tags: document.getElementById('editor-tags').value
        };
    }

    function saveDraftLocal() {
        try {
            const snap = currentFormSnapshot();
            localStorage.setItem(draftKey(), JSON.stringify({ ...snap, ts: Date.now() }));
        } catch(e) {}
    }

    function clearDraftLocal() {
        try { localStorage.removeItem(draftKey()); } catch(e) {}
    }

    function setSaveStatus(text, cls) {
        const el = document.getElementById('save-status');
        if (!el) return;
        el.textContent = text;
        el.className = 'save-status' + (cls ? ' ' + cls : '');
    }

    function handleEditorInput() {
        saveDraftLocal();
        setSaveStatus('Unsaved changes…', 'unsaved');
        const now = Date.now();
        if (!autosaveFirstChangeAt) autosaveFirstChangeAt = now;
        clearTimeout(autosaveTimer);
        const elapsedSinceFirstChange = now - autosaveFirstChangeAt;
        const remainingMaxWait = AUTOSAVE_MAX_WAIT_MS - elapsedSinceFirstChange;
        // Debounce on pauses, but throttle to a guaranteed save at least
        // every AUTOSAVE_MAX_WAIT_MS even during continuous typing.
        const delay = Math.max(0, Math.min(AUTOSAVE_DEBOUNCE_MS, remainingMaxWait));
        autosaveTimer = setTimeout(performAutosave, delay);
    }

    async function performAutosave() {
        if (isSavingNow) { autosaveTimer = setTimeout(performAutosave, 500); return; }
        const snap = currentFormSnapshot();
        if (!snap.title.trim() && !snap.body.trim()) return;
        if (lastSavedSnapshot && lastSavedSnapshot.title === snap.title && lastSavedSnapshot.body === snap.body && lastSavedSnapshot.tags === snap.tags) return;

        isSavingNow = true;
        setSaveStatus('Saving…', 'saving');
        const ok = await persistNote();
        isSavingNow = false;
        autosaveFirstChangeAt = null;

        if (ok) {
            lastSavedSnapshot = snap;
            clearDraftLocal();
            setSaveStatus('Saved', 'saved');
        } else {
            setSaveStatus('Save failed — will retry', 'unsaved');
            autosaveTimer = setTimeout(performAutosave, 4000);
        }
    }

    async function persistNote() {
        const titleRaw = document.getElementById('editor-title').value.trim();
        const bodyRaw = document.getElementById('editor-body').innerHTML.trim();
        const tagsRaw = document.getElementById('editor-tags').value.trim();
        if (!titleRaw && !bodyRaw) return false;

        try {
            const encTitle = await encrypt(titleRaw || 'Untitled');
            const encBody = await encrypt(bodyRaw);
            const encTags = await encrypt(tagsRaw);

            if (editingNoteId) {
                const res = await fetch(`${WORKER_URL}/notes/${editingNoteId}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({ title: encTitle, body: encBody, tags: encTags, pinned: notes.find(n => n.id === editingNoteId)?.pinned || 0 })
                });
                const data = await res.json();
                if (data.success) {
                    const idx = notes.findIndex(n => n.id === editingNoteId);
                    if (idx !== -1) {
                        notes[idx].title = titleRaw || 'Untitled';
                        notes[idx].body = bodyRaw;
                        notes[idx].tags = tagsRaw;
                        notes[idx].updated_at = new Date().toISOString();
                    }
                    applyFilters(); applySort(); renderFilterTags(); renderNotes(true);
                    return true;
                }
                return false;
            } else {
                const res = await fetch(`${WORKER_URL}/notes`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({ title: encTitle, body: encBody, tags: encTags, pinned: 0 })
                });
                const data = await res.json();
                if (data.success) {
                    clearDraftLocal();
                    editingNoteId = data.id;
                    const newNote = {
                        id: data.id, user_id: currentUser.id, title: titleRaw || 'Untitled',
                        body: bodyRaw, tags: tagsRaw, pinned: 0,
                        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                    };
                    notes.unshift(newNote);
                    applyFilters(); applySort(); renderFilterTags(); renderNotes(true);
                    return true;
                }
                return false;
            }
        } catch(e) { return false; }
    }

    function checkForDraft() {
        const raw = localStorage.getItem(draftKey());
        if (!raw) return;
        try {
            const d = JSON.parse(raw);
            const hasDraftContent = (d.title || '').trim() || (d.body || '').trim();
            if (!hasDraftContent) { clearDraftLocal(); return; }
            const note = editingNoteId ? notes.find(n => n.id === editingNoteId) : null;
            const savedTs = note ? new Date(note.updated_at || 0).getTime() : 0;
            const draftDiffers = d.title !== (note?.title || '') || d.body !== (note?.body || '') || d.tags !== (note?.tags || '');
            if (draftDiffers && d.ts > savedTs) {
                if (confirm('Restore unsaved draft from last session?')) {
                    document.getElementById('editor-title').value = d.title || '';
                    document.getElementById('editor-body').innerHTML = d.body || '';
                    document.getElementById('editor-tags').value = d.tags || '';
                    updateWordCount();
                    setSaveStatus('Unsaved changes…', 'unsaved');
                    return;
                }
            }
            clearDraftLocal();
        } catch(e) {}
    }

    async function finishEditing() {
        clearTimeout(autosaveTimer);
        setSaveStatus('Saving…', 'saving');
        const ok = await persistNote();
        if (ok) {
            lastSavedSnapshot = currentFormSnapshot();
            clearDraftLocal();
            showAlert('Note saved.');
        } else {
            showAlert('Could not save note.');
        }
        closeEditor();
    }

    async function deleteNote(e, noteId) {
        e.stopPropagation();
        if (!confirm('Delete this note? This cannot be undone.')) return;
        try {
            const res = await fetch(`${WORKER_URL}/notes/${noteId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeader()
            });
            const data = await res.json();
            if (data.success) { 
                notes = notes.filter(n => n.id !== noteId); 
                applyFilters();
                applySort();
                renderFilterTags();
                renderNotes(); 
                showAlert('Note deleted.'); 
            }
            else { showAlert(data.error || 'Delete failed.'); }
        } catch(e) { showAlert('Network error.'); }
    }

    document.getElementById('editor-modal').addEventListener('click', function(e) {
        if (e.target === this) closeEditor();
    });

    document.getElementById('link-dialog').addEventListener('click', function(e) {
        if (e.target === this) closeLinkDialog();
    });

    document.getElementById('link-dialog-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); confirmLinkDialog(); }
        if (e.key === 'Escape') { e.preventDefault(); closeLinkDialog(); }
    });

    document.getElementById('editor-body').addEventListener('keyup', updateWordCount);
    document.getElementById('editor-body').addEventListener('keyup', updateToolbarState);
    document.getElementById('editor-body').addEventListener('mouseup', updateToolbarState);
    document.getElementById('editor-body').addEventListener('focus', () => { try { document.execCommand('AutoUrlDetect', false, false); } catch(e) {} });
    document.getElementById('editor-body').addEventListener('input', handleEditorInput);
    document.getElementById('editor-title').addEventListener('input', handleEditorInput);
    document.getElementById('editor-tags').addEventListener('input', handleEditorInput);
    document.addEventListener('visibilitychange', () => { if (document.hidden && document.getElementById('editor-modal').classList.contains('open')) saveDraftLocal(); });
    window.addEventListener('beforeunload', () => { if (document.getElementById('editor-modal').classList.contains('open')) saveDraftLocal(); });

    document.getElementById('notes-search').addEventListener('input', (e) => {
        document.getElementById('search-clear').style.display = e.target.value ? 'block' : 'none';
        applyFilters();
        renderNotes();
    });

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('editor-modal').classList.contains('open')) { clearTimeout(autosaveTimer); performAutosave(); }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (!document.getElementById('editor-modal').classList.contains('open')) openNewNote();
        }
        if (e.key === 'Escape') closeEditor();
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            if (document.getElementById('editor-modal').classList.contains('open') && editingNoteId) {
                togglePin({stopPropagation: () => {}}, editingNoteId);
            }
        }
    });

    let scrollFadeTimer;
    window.addEventListener('scroll', () => {
        document.documentElement.classList.add('is-scrolling');
        clearTimeout(scrollFadeTimer);
        scrollFadeTimer = setTimeout(() => {
            document.documentElement.classList.remove('is-scrolling');
        }, 1200);
    }, { passive: true });

    function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function formatDate(ts) { if (!ts) return ''; return new Date(ts).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}); }
    function showAlert(msg) { const b=document.getElementById('custom-alert'); b.textContent=msg; b.style.display='block'; setTimeout(()=>b.style.display='none',3000); }

    // ── INIT ─────────────────────────────────────────────────────────
    window.addEventListener('load', async () => {
        const saved = localStorage.getItem('po_user');
        const savedView = localStorage.getItem('po_notes_view');
        if (savedView) currentView = savedView;
        
        if (saved) {
            try {
                const user = JSON.parse(saved);
                currentUser = user;
                await initCryptoKey(user);
                initNavDrawer(user);
                updateNavAvatar(user);
                showApp();
                return;
            } catch(e) {}
        }

        // No local record of a user on this subdomain — check whether a
        // valid po_token session cookie already exists (e.g. user logged
        // in on the main site). The cookie is shared across
        // *.pocketoregon.site but localStorage is not, so we must ask
        // the backend who we are before giving up.
        try {
            const res = await fetch(WORKER_URL + '/auth/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    currentUser = data.user;
                    localStorage.setItem('po_user', JSON.stringify(data.user));
                    await initCryptoKey(data.user);
                    initNavDrawer(data.user);
                    updateNavAvatar(data.user);
                    showApp();
                    return;
                }
            }
        } catch(e) {}

        initDarkMode();
        liftCurtain();
    });
