/**
 * nav-drawer.js
 * Universal Navigation Drawer Component
 */

// Global drawer state
let drawerContainer = null;
let currentUser = null;

// Inline SVG Icons
const ICONS = {
  profile: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  studio: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  stories: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  horizon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5"/><path d="M12 2L2 22h20L12 2z"/></svg>`,
  admin: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  signout: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

/**
 * Injects Google Fonts and structural/animation CSS styles.
 */
function injectStyles() {
  if (document.getElementById('nav-drawer-styles')) return;

  // Import Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap';
  document.head.appendChild(fontLink);

  // Core component CSS
  const style = document.createElement('style');
  style.id = 'nav-drawer-styles';
  style.textContent = `
    .nav-drawer-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      pointer-events: none;
    }
    
    .nav-drawer-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }

    .nav-drawer-content {
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100%;
      background: #ffffff;
      box-sizing: border-box;
      border-left: 1px solid #e5e7eb;
      border-radius: 8px 0 0 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      pointer-events: auto;
      
      /* Curtain reveal clip-path states */
      clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
      transition: clip-path 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Open modifications */
    .nav-drawer-wrapper.is-open {
      pointer-events: auto;
    }
    .nav-drawer-wrapper.is-open .nav-drawer-backdrop {
      opacity: 1;
      pointer-events: auto;
    }
    .nav-drawer-wrapper.is-open .nav-drawer-content {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }

    /* Profile Header Styling */
    .nd-profile-block {
      padding: 2rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .nd-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #fff7ed;
      border: 2px solid #f97316;
      color: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 1.25rem;
      margin-bottom: 1rem;
      text-transform: uppercase;
    }
    .nd-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.6rem;
      color: #1f2937;
      margin: 0;
      line-height: 1.2;
      letter-spacing: 0.5px;
    }
    .nd-email {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0.25rem 0 0 0;
    }

    /* Menu Lists */
    .nd-menu-list {
      list-style: none;
      padding: 1rem 0;
      margin: 0;
      flex-grow: 1;
      overflow-y: auto;
    }
    .nd-footer-list {
      list-style: none;
      padding: 1rem 0;
      margin: 0;
      border-top: 1px solid #e5e7eb;
    }

    /* Interactive List Items */
    .nd-item a, .nd-item button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 2rem;
      color: #374151;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      box-sizing: border-box;
      transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
    }
    .nd-item svg {
      transition: stroke 0.2s ease;
    }
    
    /* Standard Hover State */
    .nd-item:not(.nd-signout-item) a:hover, 
    .nd-item:not(.nd-signout-item) button:hover {
      transform: translateX(6px);
      background-color: #fff7ed;
      color: #f97316;
    }
    
    /* Dedicated Sign out Hover State */
    .nd-signout-item a:hover, 
    .nd-signout-item button:hover {
      transform: translateX(6px);
      background-color: #fef2f2;
      color: #dc2626;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Extracts initials from the user name.
 */
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/**
 * Builds dynamic DOM structures reflecting the user authorization layout.
 */
function renderDrawerHTML(user) {
  const isAdmin = user.role === 'admin';
  const isCreator = user.role === 'creator' || isAdmin;
  const hasHorizon = user.horizon_access === true || isAdmin;

  return `
    <div class="nav-drawer-backdrop"></div>
    <div class="nav-drawer-content">
      <div class="nd-profile-block">
        <div class="nd-avatar">${getInitials(user.name)}</div>
        <h2 class="nd-name">${user.name || 'User'}</h2>
        <p class="nd-email">${user.email || ''}</p>
      </div>
      
      <ul class="nd-menu-list">
        <li class="nd-item"><a href="/profile.html?id=${user.id}">${ICONS.profile} My Profile</a></li>
        <li class="nd-item"><a href="/notes/">${ICONS.notes} My Notes</a></li>
        ${isCreator ? `<li class="nd-item"><a href="/stories/create.html">${ICONS.studio} Creator Studio</a></li>` : ''}
        ${isCreator ? `<li class="nd-item"><a href="/stories/index.html?author=${user.id}">${ICONS.stories} My Stories</a></li>` : ''}
        ${hasHorizon ? `<li class="nd-item"><a href="/horizon/">${ICONS.horizon} Project Horizon</a></li>` : ''}
        ${isAdmin ? `<li class="nd-item"><a href="/admin.html">${ICONS.admin} Admin Panel</a></li>` : ''}
      </ul>

      <ul class="nd-footer-list">
        <li class="nd-item nd-signout-item">
          <button id="nd-signout-btn">${ICONS.signout} Sign out</button>
        </li>
      </ul>
    </div>
  `;
}

/**
 * Attaches operational events to UI nodes.
 */
function setupEventListeners() {
  const backdrop = drawerContainer.querySelector('.nav-drawer-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeNavDrawer);

  const signoutBtn = drawerContainer.querySelector('#nd-signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      closeNavDrawer();
      // Custom event hook allowing host websites to react to execution.
      window.dispatchEvent(new CustomEvent('nav-drawer-signout'));
    });
  }
}

/**
 * Initialization lifecycle function. Called once after client context maps.
 * @param {Object} user - The signed-in user record.
 */
export function initNavDrawer(user) {
  if (!user) return;
  currentUser = user;
  
  injectStyles();

  if (!drawerContainer) {
    drawerContainer = document.createElement('div');
    drawerContainer.className = 'nav-drawer-wrapper';
    document.body.appendChild(drawerContainer);
  }

  drawerContainer.innerHTML = renderDrawerHTML(currentUser);
  setupEventListeners();

  // Expose methods to global scope to safeguard multi-page link tags or legacy handlers
  window.openNavDrawer = openNavDrawer;
  window.closeNavDrawer = closeNavDrawer;
}

/**
 * Reveals the drawer onto view space with custom curtain wipe layout.
 */
export function openNavDrawer() {
  if (!drawerContainer) return;
  drawerContainer.classList.add('is-open');
}

/**
 * Dismisses/Hides the drawer view element.
 */
export function closeNavDrawer() {
  if (!drawerContainer) return;
  drawerContainer.classList.remove('is-open');
}

/**
 * Redraws menu structure elements whenever parameters mutate inside identity data.
 * @param {Object} updatedUser - The updated user payload object.
 */
export function updateNavDrawerUser(updatedUser) {
  if (!updatedUser) return;
  currentUser = updatedUser;
  
  if (drawerContainer) {
    const wasOpen = drawerContainer.classList.contains('is-open');
    drawerContainer.innerHTML = renderDrawerHTML(currentUser);
    setupEventListeners();
    if (wasOpen) drawerContainer.classList.add('is-open');
  }
}
