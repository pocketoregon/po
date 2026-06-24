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
  notes: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
};

function injectStyles() {
  if (document.getElementById('nav-drawer-styles')) return;
  const style = document.createElement('style');
  style.id = 'nav-drawer-styles';
  style.innerHTML = `
    .nav-drawer-wrapper { position: fixed; top: 0; right: -300px; width: 300px; height: 100vh; background: white; z-index: 10000; box-shadow: -4px 0 20px rgba(0,0,0,0.1); transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .nav-drawer-wrapper.is-open { right: 0; }
  `;
  document.head.appendChild(style);
}

function renderDrawerHTML(user) {
  return `
    <div style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
      <div style="font-weight: bold;">${user.name || 'User'}</div>
      <div style="font-size: 12px; color: #888;">${user.email || ''}</div>
    </div>
    <div style="padding: 20px;">
      <button id="nav-drawer-signout-btn" style="width: 100%; padding: 10px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer;">Sign Out</button>
    </div>
  `;
}

function setupEventListeners() {
  const btn = document.getElementById('nav-drawer-signout-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('nav-drawer-signout'));
    });
  }
}

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
}

export function openNavDrawer() {
  if (!drawerContainer) return;
  drawerContainer.classList.add('is-open');
}

export function closeNavDrawer() {
  if (!drawerContainer) return;
  drawerContainer.classList.remove('is-open');
}

export function updateNavDrawerUser(updatedUser) {
  if (!updatedUser) return;
  currentUser = updatedUser;
  if (drawerContainer) {
    drawerContainer.innerHTML = renderDrawerHTML(currentUser);
    setupEventListeners();
  }
}
