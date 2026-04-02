export function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function renderCardPage(card) {
  const isSiteInfo = card.date && card.date.includes('Origin');
  const siteAgeDays = Math.floor((Date.now() - new Date('2026-03-13')) / 86400000);
  const dateDisplay = isSiteInfo
    ? `<span>Origin date: 3/13/2026</span><span class="sep">|</span><span class="age-badge">Age: ${siteAgeDays} days</span>`
    : `<span>${escHtml(card.date)}</span>`;
  const contentHtml = card.page_content
    ? card.page_content.split('\n').map(l => l.trim()===''?'<br>':`<p>${escHtml(l)}</p>`).join('')
    : `<div class="empty-content"><p>More details coming soon.</p></div>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escHtml(card.title)} — PocketOregon</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;background:#fff;color:#1f1e24;}nav{background:white;border-bottom:1px solid #e5e7eb;padding:0 1.5rem;height:56px;display:flex;align-items:center;justify-content:space-between;}h1{font-family:'Outfit',sans-serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:800;}.hero{padding:3.5rem 1.5rem 4rem;}.content-area{max-width:860px;margin:0 auto;padding:3rem 1.5rem 5rem;}footer{background:#1f1e24;padding:2.5rem;text-align:center;color:#6b7280;font-size:.75rem;}</style></head><body>
  <nav><a href="/">PocketOregon</a><a href="/">← Back to site</a></nav>
  <div class="hero"><div style="max-width:860px;margin:0 auto"><h1>${escHtml(card.title)}</h1><div>${dateDisplay}</div></div></div>
  <div class="content-area"><p style="margin-bottom:2rem">${escHtml(card.body)}</p><div>${contentHtml}</div></div>
  <footer><p>&copy; 2026 PocketOregon. All rights reserved.</p></footer>
  </body></html>`;
}
