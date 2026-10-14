// avatar.js: shared DiceBear avatar helper (classic script, loaded before other scripts)
(function () {
  function initials(name) {
    if (!name) return '?';
    return String(name).trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // Returns an <img> from DiceBear when the user has chosen an avatar, otherwise initials.
  // Usage: poAvatarHTML(user, 32)  where user has name, avatar_style, avatar_seed
  window.poAvatarHTML = function (user, size) {
    size = size || 32;
    const u = user || {};
    if (u.avatar_seed) {
      const url = 'https://api.dicebear.com/9.x/' + encodeURIComponent(u.avatar_style || 'initials') +
                  '/svg?seed=' + encodeURIComponent(u.avatar_seed);
      return '<img src="' + url + '" alt="" style="width:' + size + 'px;height:' + size +
             'px;border-radius:50%;display:block;flex-shrink:0;">';
    }
    return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:#1f1e24;color:#fff;' +
           'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:' + Math.round(size * 0.4) +
           'px;flex-shrink:0;">' + esc(initials(u.name)) + '</div>';
  };
})();
