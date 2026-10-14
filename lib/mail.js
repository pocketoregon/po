# File: lib/mail.js
FIND
[[[
        let t = after.slice(blank + 2);
]]]
REPLACE_WITH
[[[
        let t = after.slice(blank + 2);
        const enc = (after.slice(0, blank).match(/content-transfer-encoding:\s*([^\n]+)/i) || [])[1] || '';
        if (/base64/i.test(enc)) {
          const stop = t.search(/\n--[^\n]+/);
          const chunk = stop !== -1 ? t.slice(0, stop) : t;
          try { t = decodeURIComponent(escape(atob(chunk.replace(/\s+/g, '')))); } catch (e) {}
        } else if (/quoted-printable/i.test(enc)) {
          t = t.replace(/=\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)));
        }
]]]
