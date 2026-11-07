/* lil' bird Guide Training — trainer dashboard. Mount with GT.mountTrainer(rootEl). */
(function () {
  var esc = GT.esc, C = GTContent;

  GT.mountTrainer = function (root) {
    var data = null, detail = null, openEmail = null;

    function load() {
      return GT.api('trOverview').then(function (r) { data = r; return openEmail ? loadDetail(openEmail, true) : null; })
        .then(render).catch(function (e) {
          if ((window.GT_CONFIG || {}).mode !== 'demo' && !GT.store.get('cg_token')) {
            root.innerHTML = '<div class="center-card card"><div class="eyebrow">lil\' bird Guide Training</div><h2>Trainer dashboard</h2><p class="muted">Sign in on the <a href="index.html">training page</a> or your <a href="../dashboard.html">network dashboard</a> first, then come back here.</p></div>';
            return;
          }
          root.innerHTML = GT.notOpenCard(e, 'Trainer dashboard');
        });
    }
    function loadDetail(email, quiet) {
      openEmail = email;
      return GT.api('trTrainee', { email: email }).then(function (r) { detail = r; if (!quiet) render(); });
    }

    function render() {
      var h = '<header class="top"><a class="brand" href="#"><span>lil\' bird</span><span class="sep">·</span><span class="sub">Guide Training · Trainer</span></a><div class="who">' + data.trainees.length + ' trainees</div></header>' +
        '<main class="main" style="max-width:1100px;margin:0 auto">';
      if (detail && openEmail) h += detailHtml(); else h += overviewHtml();
      h += '</main>';
      root.innerHTML = h;
      bind();
    }

    function overviewHtml() {
      var h = '<div class="eyebrow">Trainer dashboard</div><h1>Your <em>cohort</em></h1><p class="lede">Scores fill in automatically. Your time goes to flags, attendance, practicums and sign-off.</p>';
      if (data.flags.length) {
        h += '<div class="card" style="border-color:#e9c3bc"><h3>Open flags <span class="pill warn">' + data.flags.length + '</span></h3><p class="small muted">A trainee picked an option marked harmful. Have a short conversation, then resolve it with a note.</p>' +
          data.flags.map(function (f) {
            return '<div class="result-item"><div class="q-meta"><span>' + esc(f.name || f.email) + ' · Plate ' + esc(f.moduleId) + '</span><span>' + esc(GT.date(f.at)) + '</span></div>' +
              '<div class="small"><strong>Question:</strong> ' + esc(f.prompt) + '</div><div class="small" style="margin:.3rem 0 .6rem"><strong>They picked:</strong> ' + esc(f.picked) + '</div>' +
              '<div style="display:flex;gap:.5rem"><input type="text" placeholder="Note on the conversation (optional)" data-note="' + f.id + '"><button class="btn btn-dark btn-sm" data-resolve="' + f.id + '">Resolve</button></div></div>';
          }).join('') + '</div>';
      }
      h += '<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Trainee</th><th>Checks</th><th>Live it</th><th>Calls</th><th>Triads</th><th>Practicum</th><th>Final</th><th>Status</th></tr></thead><tbody>' +
        data.trainees.map(function (t) {
          var status = t.signedOffAt ? '<span class="pill ok">accredited</span>' : t.openFlags ? '<span class="pill warn">flag open</span>' : t.ready ? '<span class="pill gold">ready to sign off</span>' : '<span class="pill">in progress</span>';
          return '<tr class="row-link" data-open="' + esc(t.email) + '"><td><strong style="font-weight:500">' + esc(t.name || t.email) + '</strong><div class="small muted">' + esc(t.cohort || '') + '</div></td>' +
            '<td class="num">' + t.modulesPassed + ' / ' + t.modulesTotal + '</td><td class="num">' + t.liveDone + ' / ' + t.liveTotal + '</td>' +
            '<td class="num">' + t.calls + ' / 7</td><td class="num">' + t.triads + ' / 6</td><td class="num">' + t.practicumsPassed + ' / 2</td>' +
            '<td>' + (t.finalPassed ? '<span class="pill ok">passed</span>' : '–') + '</td><td>' + status + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      h += '<div class="card"><h3>Invite a trainee</h3><div class="grid2"><div class="field"><label>Name</label><input type="text" id="invName"></div><div class="field"><label>Email</label><input type="email" id="invEmail"></div></div>' +
        '<div class="grid2"><div class="field"><label>Cohort</label><input type="text" id="invCohort" placeholder="e.g. Founding cohort, Feb 2027"></div><div class="field"><label>Role</label><select id="invRole"><option value="trainee">Trainee</option><option value="trainer">Trainer</option></select></div></div>' +
        '<button class="btn btn-dark" id="invite">Invite</button></div>';
      return h;
    }

    function detailHtml() {
      var t = detail.trainee, s = detail.summary;
      var h = '<button class="link-btn" id="back">← back to cohort</button><div class="eyebrow" style="margin-top:.8rem">' + esc(t.cohort || '') + '</div><h1>' + esc(t.name || t.email) + '</h1><p class="lede">' + esc(t.email) + '</p>';
      if (s.signedOffAt) h += '<div class="alert ok">Accredited on ' + esc(GT.date(s.signedOffAt)) + '. The lil\' bird badge is on their coachesandguides.com profile.</div>';
      h += '<div class="grid2"><div class="card"><h3>Accreditation gates</h3>' + s.gates.map(function (g) { return '<div class="gate"><span class="tick ' + (g.met ? 'done' : g.have ? 'half' : '') + '"></span><span>' + esc(g.label) + '</span><span class="count">' + (g.id === 'flags' ? (g.met ? 'clear' : 'open') : g.have + ' / ' + g.need) + '</span></div>'; }).join('') +
        (s.signedOffAt ? '' : '<button class="btn ' + (s.ready ? 'btn-gold' : 'btn-ghost') + '" id="signoff" style="margin-top:1rem"' + (s.ready ? '' : ' disabled') + '>Sign off and award badge</button>' + (s.ready ? '' : '<p class="small muted" style="margin-top:.4rem">Unlocks when every gate is met.</p>')) + '</div>';
      h += '<div class="card"><h3>Plates</h3>' + C.MODULES.filter(function (m) { return m.hasCheck || m.liveIt; }).map(function (m) {
        var p = s.progress[m.id] || {};
        return '<div class="gate"><span class="plate-no" style="font-family:Fraunces,serif;font-style:italic;color:var(--gold);width:2rem">' + m.id + '</span><span>' + esc(m.title) + '</span><span class="count">' +
          (m.liveIt ? (p.liveItDone ? '<span class="pill ok">lived</span> ' : '<span class="pill">live</span> ') : '') +
          (p.checkPassedAt ? '<span class="pill ok">' + Math.round((p.bestPct || 0) * 100) + '%</span>' : p.bestPct ? '<span class="pill gold">' + Math.round(p.bestPct * 100) + '%</span>' : '<span class="pill">–</span>') + '</span></div>';
      }).join('') + '</div></div>';
      h += '<div class="card"><h3>Group calls</h3><p class="small muted">Tap to mark attended or made up.</p><div class="toggle-call">' +
        C.CALLS.map(function (c) { var on = s.callsAttended.indexOf(c.id) > -1; return '<button class="' + (on ? 'on' : '') + '" data-call="' + c.id + '" data-on="' + (on ? 1 : 0) + '">wk ' + c.week + ' · ' + esc(c.title) + '</button>'; }).join('') + '</div>' +
        '<h3 style="margin-top:1.4rem">Triad rounds as coach</h3>' + (s.triads.filter(function (x) { return x.role === 'coach'; }).map(function (x) {
          return '<div class="gate"><span>' + esc(callName(x.callId)) + ' · observer ' + esc(x.observerEmail) + '</span><span class="count">' + (x.confirmedAt ? '<span class="pill ok">confirmed</span>' : '<span class="pill">unconfirmed</span>') + '</span></div>';
        }).join('') || '<p class="small muted">None logged yet.</p>') + '</div>';
      [1, 2].forEach(function (n) {
        var p = s.practicums.filter(function (x) { return x.n === n; })[0] || { scores: {}, guardrailCameUp: false, notes: '' };
        h += '<div class="card" data-prac="' + n + '"><h3>Practicum ' + n + ' ' + (p.at ? (p.passed ? '<span class="pill ok">passed</span>' : '<span class="pill gold">not yet</span>') : '') + '</h3>' +
          C.RUBRIC.map(function (r) {
            return '<div class="rubric-row"><div><div style="font-weight:500">' + esc(r.label) + '</div><div class="anchors">1: ' + esc(r.low) + '<br>4: ' + esc(r.high) + '</div></div>' +
              '<div class="seg" data-r="' + r.id + '">' + [1, 2, 3, 4].map(function (v) { return '<button class="' + (Number(p.scores[r.id]) === v ? 'on' : '') + '" data-v="' + v + '">' + v + '</button>'; }).join('') + '</div></div>';
          }).join('') +
          '<label class="check" style="margin-top:.6rem"><input type="checkbox" class="gcu"' + (p.guardrailCameUp ? ' checked' : '') + '><span>A guardrail moment came up in this session (then guardrails must score 4)</span></label>' +
          '<div class="field"><label>Notes for the trainee</label><textarea class="pnotes" style="min-height:70px">' + esc(p.notes || '') + '</textarea></div>' +
          '<button class="btn btn-dark btn-sm savep">Save practicum ' + n + '</button></div>';
      });
      h += '<div class="card"><h3>Attempts</h3>' + (detail.attempts.map(function (a) {
        return '<div class="gate"><span class="plate-no" style="font-family:Fraunces,serif;font-style:italic;color:var(--gold);width:2rem">' + esc(a.moduleId) + '</span><span>' + esc(GT.date(a.at)) + '</span><span class="count">' + Math.round(a.pct * 100) + '% ' + (a.passed ? '<span class="pill ok">pass</span>' : '<span class="pill gold">fail</span>') + (a.harmful ? ' <span class="pill warn">harmful pick</span>' : '') + '</span></div>';
      }).join('') || '<p class="small muted">No attempts yet.</p>') + '</div>';
      if (detail.flags.length) h += '<div class="card"><h3>Flag history</h3>' + detail.flags.map(function (f) { return '<div class="result-item small"><strong>Plate ' + esc(f.moduleId) + '</strong> · ' + esc(GT.date(f.at)) + ' · ' + (f.resolvedAt ? 'resolved' + (f.note ? ': ' + esc(f.note) : '') : '<span class="pill warn">open</span>') + '<div class="muted">' + esc(f.prompt) + '</div><div>Picked: ' + esc(f.picked) + '</div></div>'; }).join('') + '</div>';
      return h;
    }
    function callName(id) { var c = C.CALLS.filter(function (x) { return x.id === id; })[0]; return c ? c.title : 'Outside a call'; }

    function act(action, payload, msg) {
      return GT.api(action, payload).then(function (r) { if (msg) GT.toast(msg); return load().then(function () { return r; }); }).catch(function (e) { GT.toast(e.message, true); });
    }

    function bind() {
      GT.$$('[data-open]', root).forEach(function (tr) { tr.onclick = function () { loadDetail(tr.getAttribute('data-open')).catch(function (e) { GT.toast(e.message, true); }); }; });
      GT.$$('[data-resolve]', root).forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-resolve'); act('trResolveFlag', { flagId: id, note: (GT.$('[data-note="' + id + '"]', root) || {}).value || '' }, 'Flag resolved'); }; });
      var inv = GT.$('#invite', root);
      if (inv) inv.onclick = function () { act('trInvite', { name: GT.$('#invName', root).value, email: GT.$('#invEmail', root).value, cohort: GT.$('#invCohort', root).value, role: GT.$('#invRole', root).value }, 'Invited'); };
      var back = GT.$('#back', root); if (back) back.onclick = function () { detail = null; openEmail = null; render(); };
      GT.$$('[data-call]', root).forEach(function (b) { b.onclick = function () { act('trSetAttendance', { email: openEmail, callId: b.getAttribute('data-call'), attended: b.getAttribute('data-on') !== '1' }); }; });
      GT.$$('.seg button', root).forEach(function (b) { b.onclick = function () { GT.$$('button', b.parentNode).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; });
      GT.$$('[data-prac]', root).forEach(function (card) {
        GT.$('.savep', card).onclick = function () {
          var scores = {}; GT.$$('.seg', card).forEach(function (seg) { var on = GT.$('button.on', seg); if (on) scores[seg.getAttribute('data-r')] = Number(on.getAttribute('data-v')); });
          var gcu = GT.$('.gcu', card).checked;
          if (!gcu) delete scores.guardrails;
          act('trSavePracticum', { email: openEmail, n: Number(card.getAttribute('data-prac')), scores: scores, guardrailCameUp: gcu, notes: GT.$('.pnotes', card).value })
            .then(function (r) { if (r) GT.toast(r.passed ? 'Saved: passed' : 'Saved: not passed yet'); });
        };
      });
      var so = GT.$('#signoff', root);
      // Two-step confirm inline (browser confirm() dialogs are blocked in some embeds).
      if (so) so.onclick = function () {
        if (!so.dataset.armed) { so.dataset.armed = '1'; so.textContent = 'Click again to confirm sign-off'; return; }
        act('trSignOff', { email: openEmail }, 'Signed off. Badge awarded.');
      };
    }

    load();
    return { reload: load };
  };
})();
