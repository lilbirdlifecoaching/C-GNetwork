/* Shared browser helpers: escaping, tiny markdown, toast, API adapter. */
var GT = window.GT || {};
GT.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
GT.$ = function (s, r) { return (r || document).querySelector(s); };
GT.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

// Light markdown: ## / ### headings, paragraphs, - and 1. lists, > quotes, **bold**, *italic*,
// and a paragraph starting "!note " becomes one of Luke's handwritten field notes.
GT.md = function (src) {
  var inline = function (t) {
    return GT.esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  };
  return String(src || '').split(/\n{2,}/).map(function (block) {
    var b = block.trim(); if (!b) return '';
    if (/^!note /.test(b)) return '<div class="field-note"><span class="label">Luke\'s field note</span>' + inline(b.slice(6)) + '</div>';
    if (/^### /.test(b)) return '<h3>' + inline(b.slice(4)) + '</h3>';
    if (/^## /.test(b)) return '<h2>' + inline(b.slice(3)) + '</h2>';
    if (/^> /.test(b)) return '<blockquote>' + inline(b.replace(/^> ?/gm, '')) + '</blockquote>';
    var lines = b.split('\n');
    if (lines.every(function (l) { return /^- /.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.slice(2)) + '</li>'; }).join('') + '</ul>';
    if (lines.every(function (l) { return /^\d+\. /.test(l); })) return '<ol>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\d+\. /, '')) + '</li>'; }).join('') + '</ol>';
    return '<p>' + inline(b).replace(/\n/g, '<br>') + '</p>';
  }).join('').replace(/<\/ol><ol>/g, '').replace(/<\/ul><ul>/g, ''); // a list split by blank lines stays one list
};

GT.toast = function (msg, err) {
  var t = GT.$('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(GT.toast._t); GT.toast._t = setTimeout(function () { t.className = 'toast'; }, 3200);
};

// Friendly states for the live site: not enrolled yet, or the training backend not switched on yet.
GT.notOpenCard = function (e, title) {
  var msg = String((e && e.message) || '');
  var body;
  if (/not enrolled/i.test(msg)) {
    body = '<p>You\'re signed in, but you\'re not enrolled in Guide Training yet. Places are by invitation. If you\'d like to be considered for the next cohort, reach out to Luke.</p>';
  } else if (/trainers only/i.test(msg)) {
    body = '<p>This page is for Guide Training trainers.</p>';
  } else {
    body = '<p>Guide Training for the <strong>lil\' bird Accredited</strong> badge is opening soon. Places are by invitation, and enrolled coaches will get a link when their cohort begins.</p>';
  }
  return '<div class="center-card card"><div class="eyebrow">lil\' bird Guide Training</div><h2>' + GT.esc(title || 'Opening soon') + '</h2>' + body +
    '<p class="small muted" style="margin-top:1rem"><a href="../dashboard.html">Back to your dashboard</a></p></div>';
};

GT.date = function (iso) {
  if (!iso) return '';
  var d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/* API adapter.
 * Live: posts {action, token, ...data} to the coaches & guides Apps Script, exactly like dashboard.html,
 *       reusing the same sign-in token (localStorage 'cg_token').
 * Demo: calls an in-browser backend (GT.demoBackend) with the same actions.
 */
GT.store = {
  get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
};
GT.api = function (action, data) {
  var cfg = window.GT_CONFIG || {};
  if (cfg.mode === 'demo') {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try { resolve(GT.demoBackend.call(action, data || {})); } catch (e) { reject(e); }
      }, 120);
    });
  }
  var body = Object.assign({ action: action, token: GT.store.get('cg_token') }, data || {});
  return fetch(cfg.api, { method: 'POST', body: JSON.stringify(body) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j.error === 'AUTH') { GT.store.del('cg_token'); if (GT.onAuthLost) GT.onAuthLost(); throw new Error('Your sign-in has expired. Please sign in again.'); }
      if (!j.ok) throw new Error(j.error || 'Something went wrong.');
      return j;
    });
};
window.GT = GT;
