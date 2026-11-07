/* lil' bird Guide Training — trainee app. Mount with GT.mountTrainee(rootEl). */
(function () {
  var esc = GT.esc, md = GT.md;
  var C = GTContent;
  var MOD = {}; C.MODULES.forEach(function (m) { MOD[m.id] = m; });

  GT.mountTrainee = function (root, opts) {
    opts = opts || {};
    var me = null;
    var view = { kind: 'home' };
    var run = null;      // active check { moduleId, attemptId, items, i, answers }
    var result = null;   // last submitted result { moduleId, ... }

    function load() {
      return GT.api('tMe').then(function (r) { me = r; render(); })
        .catch(function (e) {
          if ((window.GT_CONFIG || {}).mode !== 'demo' && !GT.store.get('cg_token')) return renderSignIn();
          root.innerHTML = GT.notOpenCard(e);
        });
    }

    // ── Sign in (live mode only, same flow and token as the network dashboard) ──
    function renderSignIn() {
      root.innerHTML = '<div class="center-card card"><div class="eyebrow">lil\' bird Guide Training</div><h2>Sign in</h2>' +
        '<p class="muted small">Use the email you joined the coaches & guides network with. We\'ll email you a 6-digit code.</p>' +
        '<div id="s1"><div class="field"><input type="email" id="em" placeholder="you@example.com"></div><button class="btn btn-dark" id="send">Email me a code</button></div>' +
        '<div id="s2" class="hidden"><div class="field"><input type="text" id="code" placeholder="6-digit code" inputmode="numeric"></div><button class="btn btn-dark" id="ver">Sign in</button></div>' +
        '<p class="small muted" id="msg" style="margin-top:.8rem"></p></div>';
      var email = '';
      GT.$('#send', root).onclick = function () {
        email = GT.$('#em', root).value.trim();
        GT.api('requestCode', { email: email }).then(function () { GT.$('#s1', root).classList.add('hidden'); GT.$('#s2', root).classList.remove('hidden'); GT.$('#msg', root).textContent = 'If that email is in the network, a code is on its way.'; })
          .catch(function (e) { GT.$('#msg', root).textContent = e.message; });
      };
      GT.$('#ver', root).onclick = function () {
        GT.api('verifyCode', { email: email, code: GT.$('#code', root).value }).then(function (r) { GT.store.set('cg_token', r.token); load(); })
          .catch(function (e) { GT.$('#msg', root).textContent = e.message; });
      };
    }
    GT.onAuthLost = renderSignIn;

    // ── Helpers ──
    function prog(id) { return (me.summary.progress[id]) || {}; }
    function plateState(m) {
      var p = prog(m.id);
      if (m.final) return me.summary.finalPassedAt ? 'done' : '';
      if (m.practicum) { var n = me.summary.practicums.filter(function (x) { return x.passed; }).length; return n >= 2 ? 'done' : n ? 'half' : ''; }
      var parts = [], done = [];
      if (m.liveIt) { parts.push(1); if (p.liveItDone) done.push(1); }
      if (m.hasCheck) { parts.push(1); if (p.checkPassedAt) done.push(1); }
      if (!parts.length) return '';
      if (done.length === parts.length) return 'done';
      return (done.length || p.learnOpenedAt) ? 'half' : '';
    }
    function go(v) { view = v; run = null; result = null; render(); window.scrollTo(0, 0); }

    // ── Layout ──
    function render() {
      var t = me.trainee;
      root.innerHTML =
        '<header class="top"><a class="brand" href="#"><span>lil\' bird</span><span class="sep">·</span><span class="sub">Guide Training</span></a>' +
        '<div class="who">' + esc(t.name || t.email) + (t.cohort ? ' · <span class="muted">' + esc(t.cohort) + '</span>' : '') +
        ((window.GT_CONFIG || {}).mode === 'demo' ? '' : ' <button class="link-btn" id="so">sign out</button>') + '</div></header>' +
        '<div class="shell"><nav class="rail">' + railHtml() + '</nav><main class="main" id="main"></main></div>';
      GT.$$('[data-go]', root).forEach(function (el) {
        el.onclick = function (e) { e.preventDefault(); var id = el.getAttribute('data-go'); go(id === 'home' ? { kind: 'home' } : { kind: 'plate', id: id }); };
      });
      var so = GT.$('#so', root); if (so) so.onclick = function () { GT.api('signOut').catch(function () {}); GT.store.del('cg_token'); renderSignIn(); };
      var onLink = GT.$('.rail .plate-link.on', root);
      if (onLink && window.innerWidth < 820) { var rl = GT.$('.rail', root); rl.scrollLeft = onLink.offsetLeft - 16; }
      var main = GT.$('#main', root);
      if (view.kind === 'home') renderHome(main); else renderPlate(main, MOD[view.id]);
    }

    function railHtml() {
      var h = '<div class="home-link' + (view.kind === 'home' ? ' on' : '') + '" data-go="home">Your field guide</div>';
      C.PARTS.forEach(function (p) {
        h += '<div class="part">' + esc(p.label + ' · ' + p.title) + '</div>';
        C.MODULES.filter(function (m) { return m.part === p.id; }).forEach(function (m) {
          var st = plateState(m);
          h += '<div class="plate-link' + (view.kind === 'plate' && view.id === m.id ? ' on' : '') + '" data-go="' + m.id + '">' +
            '<span class="plate-no">' + m.id + '</span><span>' + esc(m.title) + '</span><span class="tick ' + st + '"></span></div>';
        });
      });
      return h;
    }

    // ── Home ──
    function renderHome(main) {
      var s = me.summary, t = me.trainee;
      var metGates = s.gates.filter(function (g) { return g.met; }).length;
      var next = C.MODULES.filter(function (m) { return plateState(m) !== 'done'; })[0];
      var toConfirm = s.triads.filter(function (x) { return x.role === 'coach' && !x.confirmedAt; });
      var h = '<div class="eyebrow">Your field guide</div><h1>Hello, <em>' + esc((t.name || '').split(' ')[0] || 'friend') + '</em>.</h1>' +
        '<p class="lede">You\'ll go through the lil\' bird Intensive yourself, learn why each session works and how to run it, then show you\'ve got it. You can\'t give what you don\'t have.</p>';
      if (s.signedOffAt) {
        h += '<div class="cert"><div class="eyebrow">Coaches & Guides Network</div><h2>lil\' bird Accredited Guide</h2><p>' + esc(t.name) + '</p><p class="muted small">Signed off ' + esc(GT.date(s.signedOffAt)) + (t.cohort ? ' · ' + esc(t.cohort) : '') + '</p></div>';
      }
      if (s.openFlags) h += '<div class="alert warn">One of your answers was flagged for a conversation with your trainer. Accreditation is paused until you\'ve talked. This is normal, and it\'s how we keep clients safe.</div>';
      if (toConfirm.length) {
        h += '<div class="card"><h3>Rounds to confirm</h3><p class="small muted">An observer logged a triad round where you coached. Confirm it was you.</p>' +
          toConfirm.map(function (x) { return '<div class="gate"><span>' + esc(callTitle(x.callId)) + ' · observed by ' + esc(peerName(x.observerEmail)) + '</span><span class="count"><button class="btn btn-dark btn-sm" data-confirm="' + x.id + '">Confirm</button></span></div>'; }).join('') + '</div>';
      }
      h += '<div class="grid2"><div class="card"><h3>Accreditation</h3><div class="bar"><span style="width:' + Math.round(metGates / s.gates.length * 100) + '%"></span></div>' +
        '<p class="small muted">' + metGates + ' of ' + s.gates.length + ' gates met</p>' +
        s.gates.map(function (g) { return '<div class="gate"><span class="tick ' + (g.met ? 'done' : g.have ? 'half' : '') + '"></span><span>' + esc(g.label) + '</span><span class="count">' + (g.id === 'flags' ? (g.met ? 'clear' : 'open') : g.have + ' / ' + g.need) + '</span></div>'; }).join('') + '</div>';
      h += '<div class="card"><h3>Up next</h3>' + (next ? '<p class="plate-no" style="font-family:Fraunces,serif;font-style:italic;color:var(--gold)">Plate ' + next.id + '</p><p style="font-family:Fraunces,serif;font-size:1.2rem">' + esc(next.title) + '</p><p class="small muted" style="margin:.4rem 0 1rem">' + esc(next.summary) + '</p><button class="btn btn-dark" data-go="' + next.id + '">Open plate</button>' : '<p class="muted">Every plate is done.</p>') +
        '<h3 style="margin-top:1.6rem">Group calls</h3>' +
        C.CALLS.map(function (c) { var att = s.callsAttended.indexOf(c.id) > -1; return '<div class="call-row"><span class="wk">wk ' + c.week + '</span><span>' + esc(c.title) + '</span>' + (att ? '<span class="pill ok">attended</span>' : '<span class="pill">upcoming</span>') + '</div>'; }).join('') + '</div></div>';
      main.innerHTML = h;
      GT.$$('[data-go]', main).forEach(function (el) { el.onclick = function () { go({ kind: 'plate', id: el.getAttribute('data-go') }); }; });
      GT.$$('[data-confirm]', main).forEach(function (b) {
        b.onclick = function () { b.disabled = true; GT.api('tConfirmTriad', { triadId: b.getAttribute('data-confirm') }).then(function () { GT.toast('Round confirmed'); return load(); }).catch(function (e) { GT.toast(e.message, true); b.disabled = false; }); };
      });
    }

    function callTitle(id) { var c = C.CALLS.filter(function (x) { return x.id === id; })[0]; return c ? c.title : 'Outside a call'; }
    function peerName(email) { var p = me.peers.filter(function (x) { return x.email === email; })[0]; return p ? p.name : email; }

    // ── Plate ──
    function tabsFor(m) {
      var t = [];
      if (m.liveIt) t.push(['live', 'Live it']);
      t.push(['learn', m.practicum || m.final ? 'How it works' : 'Learn it']);
      if (m.hasCheck || m.final) t.push(['check', m.final ? 'Final assessment' : 'Check it']);
      if (m.practice) t.push(['practice', 'Practice it']);
      if (m.practicum) t.push(['scores', 'Your scores']);
      return t;
    }

    function renderPlate(main, m) {
      var tabs = tabsFor(m);
      if (!view.tab || !tabs.some(function (t) { return t[0] === view.tab; })) view.tab = tabs[0][0];
      var h = '<div class="plate-head"><div class="plate-badge">' + m.id + '</div><div><div class="eyebrow">Plate ' + m.id + ' · ' + esc(C.PARTS.filter(function (p) { return p.id === m.part; })[0].title) + '</div>' +
        '<h1>' + esc(m.title) + '</h1></div></div>' +
        '<div class="heart">' + esc(m.heart) + '</div>' +
        '<div class="tabs">' + tabs.map(function (t, i) { return '<button class="tab' + (view.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '"><span class="n">' + (i + 1) + '</span>' + t[1] + '</button>'; }).join('') + '</div><div id="pane"></div>';
      main.innerHTML = h;
      GT.$$('[data-tab]', main).forEach(function (b) { b.onclick = function () { view.tab = b.getAttribute('data-tab'); run = null; result = null; render(); }; });
      var pane = GT.$('#pane', main);
      ({ live: paneLive, learn: paneLearn, check: paneCheck, practice: panePractice, scores: paneScores })[view.tab](pane, m);
    }

    function paneLive(pane, m) {
      var p = prog(m.id);
      pane.innerHTML = '<div class="card"><h3>Do the session yourself first</h3><p>Go through <strong>' + esc(m.title) + '</strong> in your Solo course and workbook, as a participant. Set your own action step, with a day to do it.</p>' +
        '<p class="small muted">Nobody reads what you write there. It belongs to you. Here you only tick that it\'s done.</p>' +
        '<label class="check"><input type="checkbox" id="lv1"' + (p.liveItDone ? ' checked' : '') + '><span>I\'ve done this session myself</span></label>' +
        '<label class="check"><input type="checkbox" id="lv2"' + (p.actionStepSet ? ' checked' : '') + '><span>I set my own action step, with a day</span></label></div>' +
        '<button class="btn btn-dark" id="toLearn">Next: Learn it</button>';
      var save = function () {
        GT.api('tSetLiveIt', { moduleId: m.id, done: GT.$('#lv1', pane).checked, actionStepSet: GT.$('#lv2', pane).checked })
          .then(function () { return GT.api('tMe'); }).then(function (r) { me = r; GT.$('.rail', root).innerHTML = railHtml(); rebindRail(); GT.toast('Saved'); })
          .catch(function (e) { GT.toast(e.message, true); });
      };
      GT.$('#lv1', pane).onchange = save; GT.$('#lv2', pane).onchange = save;
      GT.$('#toLearn', pane).onclick = function () { view.tab = 'learn'; render(); };
    }
    function rebindRail() {
      GT.$$('.rail [data-go]', root).forEach(function (el) { el.onclick = function () { var id = el.getAttribute('data-go'); go(id === 'home' ? { kind: 'home' } : { kind: 'plate', id: id }); }; });
    }

    function paneLearn(pane, m) {
      var text = (window.GTLearn || {})[m.id] || '> The teaching for this plate is still being written.';
      pane.innerHTML = '<div class="prose">' + md(text) + '</div>' +
        (m.liveIt ? '<div class="card" style="margin-top:1.5rem"><h3>Reflection (not scored)</h3><p class="muted">What did you notice in your own ' + esc(m.title) + ' session that you\'ll watch for in a client? Bring it to the next call if you like.</p></div>' : '') +
        ((m.hasCheck || m.final) ? '<button class="btn btn-dark" id="toCheck">Next: ' + (m.final ? 'Final assessment' : 'Check it') + '</button>' : '');
      // Opening Learn it is recorded: it unlocks the check, and a retake after a fail.
      GT.api('tOpenLearn', { moduleId: m.id }).then(function () { return GT.api('tMe'); }).then(function (r) { me = r; GT.$('.rail', root).innerHTML = railHtml(); rebindRail(); }).catch(function () {});
      var b = GT.$('#toCheck', pane); if (b) b.onclick = function () { view.tab = 'check'; render(); };
    }

    // ── Check it ──
    function paneCheck(pane, m) {
      if (run && run.moduleId === m.id) return renderRunner(pane, m);
      if (result && result.moduleId === m.id) return renderResult(pane, m);
      var a = me.attempts[m.id], p = prog(m.id);
      var need = Math.round((m.final ? me.rules.finalPassPct : me.rules.passPct) * 100);
      var n = m.final ? Math.min(me.rules.finalSize, a.poolSize) : Math.min(m.checkSize || 8, a.poolSize);
      var h = '<div class="card"><h3>' + (m.final ? 'Final assessment' : 'Check it') + '</h3>' +
        '<p>' + n + ' questions. Pass at <strong>' + need + '%</strong> with no harmful picks.' + (m.crisisModule || m.id === 'I2' ? ' Crisis questions must be answered at the lil\' bird standard.' : '') + '</p>' +
        '<p class="small muted">You\'ll see why each answer is right or wrong once you submit. If you don\'t pass, re-read Learn it and a retake unlocks with fresh questions where the pool allows.</p>';
      if (p.checkPassedAt || (m.final && me.summary.finalPassedAt)) h += '<div class="alert ok">Passed' + (p.bestPct ? ', best score ' + Math.round(p.bestPct * 100) + '%' : '') + '. You can take it again for practice.</div>';
      else if (a.last) h += '<div class="alert info">Last attempt: ' + Math.round(a.last.pct * 100) + '%. Not passed yet.</div>';
      if (!a.poolSize) h += '<div class="alert info">Questions for this plate are still being written.</div>';
      else if (!a.canAttempt.ok) h += '<div class="alert info">' + esc(a.canAttempt.reason) + '</div>';
      h += '<button class="btn btn-dark" id="start"' + (a.canAttempt.ok && a.poolSize ? '' : ' disabled') + '>' + (a.last ? 'Start again' : 'Start') + '</button></div>';
      pane.innerHTML = h;
      GT.$('#start', pane).onclick = function () {
        this.disabled = true;
        GT.api('tStartCheck', { moduleId: m.id }).then(function (r) { run = { moduleId: m.id, attemptId: r.attemptId, items: r.items, i: 0, answers: {} }; render(); })
          .catch(function (e) { GT.toast(e.message, true); render(); });
      };
    }

    var TYPE_LABEL = { knowledge: 'Knowledge', scenario: 'Scenario', spot_move: 'Spot the move', question_craft: 'Question craft', short_answer: 'Short answer' };

    function renderRunner(pane, m) {
      var it = run.items[run.i], total = run.items.length;
      var chosen = run.answers[it.id];
      var h = '<div class="q-card"><div class="q-meta"><span>' + TYPE_LABEL[it.type] + '</span><span>' + (run.i + 1) + ' of ' + total + '</span></div>';
      if (it.transcript) h += '<div class="transcript">' + it.transcript.map(function (l) { return '<div><b>' + esc(l[0]) + ':</b> ' + esc(l[1]) + '</div>'; }).join('') + '</div>';
      h += '<div class="q-prompt">' + esc(it.prompt) + '</div>';
      if (it.type === 'short_answer') h += '<textarea id="sa">' + esc(chosen || '') + '</textarea>';
      else h += it.options.map(function (o) { return '<button class="opt' + (chosen === o.i ? ' on' : '') + '" data-opt="' + o.i + '">' + esc(o.text) + '</button>'; }).join('');
      h += '<div class="q-nav"><button class="btn btn-ghost btn-sm" id="prev"' + (run.i ? '' : ' disabled') + '>Back</button><div class="dots">' +
        run.items.map(function (x, i) { return '<span class="' + (i === run.i ? 'c' : run.answers[x.id] != null ? 'a' : '') + '"></span>'; }).join('') + '</div>';
      var answered = run.items.every(function (x) { return run.answers[x.id] != null && run.answers[x.id] !== ''; });
      h += run.i < total - 1 ? '<button class="btn btn-dark btn-sm" id="next"' + (chosen != null ? '' : ' disabled') + '>Next</button>'
                             : '<button class="btn btn-gold btn-sm" id="submit"' + (answered ? '' : ' disabled') + '>Submit</button>';
      h += '</div></div>';
      pane.innerHTML = h;
      GT.$$('[data-opt]', pane).forEach(function (b) { b.onclick = function () { run.answers[it.id] = Number(b.getAttribute('data-opt')); renderRunner(pane, m); }; });
      var sa = GT.$('#sa', pane); if (sa) sa.oninput = function () { run.answers[it.id] = sa.value; };
      GT.$('#prev', pane).onclick = function () { run.i--; renderRunner(pane, m); };
      var nx = GT.$('#next', pane); if (nx) nx.onclick = function () { run.i++; renderRunner(pane, m); };
      var sb = GT.$('#submit', pane); if (sb) sb.onclick = function () {
        sb.disabled = true; sb.textContent = 'Scoring…';
        var items = run.items;
        GT.api('tSubmitCheck', { attemptId: run.attemptId, answers: run.answers }).then(function (r) {
          r.moduleId = m.id; r.items = items; result = r; run = null; return GT.api('tMe');
        }).then(function (r) { me = r; render(); }).catch(function (e) { GT.toast(e.message, true); sb.disabled = false; sb.textContent = 'Submit'; });
      };
    }

    function renderResult(pane, m) {
      var r = result;
      var h = '<div class="card"><div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap"><span class="score-chip ' + (r.passed ? 'pass' : 'fail') + '">' + Math.round(r.pct * 100) + '%<small>' + r.points + ' / ' + r.max + ' points</small></span>' +
        '<div><strong>' + (r.passed ? 'Passed.' : 'Not passed yet.') + '</strong> <span class="muted">Pass mark ' + Math.round(r.need * 100) + '%.</span></div></div>';
      if (r.harmful.length) h += '<div class="alert warn">You chose an option marked harmful. Your trainer has been notified and will set up a short conversation. Accreditation is paused until then. Read the rationale below. That\'s what this is for.</div>';
      else if (r.crisisMissed) h += '<div class="alert warn">A crisis question wasn\'t answered at the lil\' bird standard. Re-read Learn it before your retake.</div>';
      else if (!r.passed) h += '<div class="alert info">Re-read Learn it, then your retake unlocks.</div>';
      h += '</div><h2>Every answer, explained</h2>';
      r.results.forEach(function (res, idx) {
        var it = r.items.filter(function (x) { return x.id === res.itemId; })[0];
        h += '<div class="result-item"><div class="q-meta"><span>' + TYPE_LABEL[it.type] + '</span><span>' + res.points + ' / ' + res.max + '</span></div>';
        if (it.transcript) h += '<div class="transcript">' + it.transcript.map(function (l) { return '<div><b>' + esc(l[0]) + ':</b> ' + esc(l[1]) + '</div>'; }).join('') + '</div>';
        h += '<div class="q-prompt" style="font-size:1.02rem">' + esc(it.prompt) + '</div>';
        if (res.pending) { h += '<p class="small muted">Your answer goes to your trainer to mark.</p></div>'; return; }
        (res.options || []).forEach(function (o, i) {
          var picked = Number(res.choice) === i;
          var tag = o.weight || (picked ? 'incorrect' : '');
          var show = picked || o.weight === 'best' || o.weight === 'correct' || it.type === 'scenario';
          if (!show) return;
          h += '<div class="result-opt' + (picked ? ' picked' : '') + '">' + (tag ? '<span class="tag ' + tag + '">' + (tag === 'correct' ? 'right answer' : tag) + '</span>' : '') +
            '<div>' + esc(o.text) + (picked ? ' <span class="muted small">(your pick)</span>' : '') + (o.rationale ? '<div class="rationale">' + esc(o.rationale) + '</div>' : '') + '</div></div>';
        });
        if (res.itemRationale) h += '<p class="rationale" style="margin-top:.5rem">' + esc(res.itemRationale) + '</p>';
        h += '</div>';
      });
      h += '<div style="margin-top:1.5rem;display:flex;gap:.6rem"><button class="btn btn-dark" id="back">Back to plate</button>' + (!r.passed ? '<button class="btn btn-ghost" id="relearn">Re-read Learn it</button>' : '') + '</div>';
      pane.innerHTML = h;
      GT.$('#back', pane).onclick = function () { result = null; render(); };
      var rl = GT.$('#relearn', pane); if (rl) rl.onclick = function () { result = null; view.tab = 'learn'; render(); };
    }

    // ── Practice it ──
    function panePractice(pane, m) {
      var mine = me.summary.triads.filter(function (x) { return x.role === 'observer'; });
      var h = '<div class="card"><h3>On the call</h3><p>' + esc(m.practice) + '</p></div>' +
        '<div class="card"><h3>Log a round you observed</h3><p class="small muted">The observer logs each round. The coach then confirms it on their home page.</p>' +
        '<div class="grid2"><div class="field"><label>Who coached?</label><select id="tc"><option value="">Choose…</option>' + me.peers.map(function (p) { return '<option value="' + esc(p.email) + '">' + esc(p.name || p.email) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Which call?</label><select id="tcall">' + C.CALLS.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title + ' (wk ' + c.week + ')') + '</option>'; }).join('') + '<option value="">Outside a call (makeup)</option></select></div></div>';
      C.TRIAD_LOG.forEach(function (q) {
        if (q.kind === 'yesno') h += '<label class="check"><input type="checkbox" data-q="' + q.id + '"><span>' + esc(q.q) + '</span></label>';
        else if (q.kind === 'number') h += '<div class="field"><label>' + esc(q.q) + '</label><input type="number" min="0" data-q="' + q.id + '" style="max-width:7rem"></div>';
        else h += '<div class="field"><label>' + esc(q.q) + '</label><input type="text" data-q="' + q.id + '"></div>';
      });
      h += '<button class="btn btn-dark" id="logIt">Log round</button></div>';
      if (mine.length) h += '<div class="card"><h3>Rounds you\'ve logged</h3>' + mine.map(function (x) { return '<div class="gate"><span>' + esc(peerName(x.coachEmail)) + ' coached · ' + esc(callTitle(x.callId)) + '</span><span class="count">' + (x.confirmedAt ? '<span class="pill ok">confirmed</span>' : '<span class="pill">awaiting coach</span>') + '</span></div>'; }).join('') + '</div>';
      pane.innerHTML = h;
      GT.$('#logIt', pane).onclick = function () {
        var coach = GT.$('#tc', pane).value; if (!coach) return GT.toast('Choose who coached', true);
        var answers = {}; GT.$$('[data-q]', pane).forEach(function (el) { answers[el.getAttribute('data-q')] = el.type === 'checkbox' ? el.checked : el.value; });
        GT.api('tLogTriad', { coachEmail: coach, callId: GT.$('#tcall', pane).value, answers: answers })
          .then(function () { GT.toast('Round logged. The coach will confirm it.'); return load(); }).catch(function (e) { GT.toast(e.message, true); });
      };
    }

    function paneScores(pane) {
      var ps = me.summary.practicums;
      if (!ps.length) { pane.innerHTML = '<div class="card"><p class="muted">No practicum scores yet. Your trainer adds them after each observed session.</p></div>'; return; }
      pane.innerHTML = ps.sort(function (a, b) { return a.n - b.n; }).map(function (p) {
        return '<div class="card"><h3>Practicum ' + p.n + ' ' + (p.passed ? '<span class="pill ok">passed</span>' : '<span class="pill gold">not yet</span>') + '</h3>' +
          C.RUBRIC.filter(function (r) { return r.id !== 'guardrails' || p.guardrailCameUp; }).map(function (r) { return '<div class="gate"><span>' + esc(r.label) + '</span><span class="count">' + (p.scores[r.id] || '–') + ' / 4</span></div>'; }).join('') +
          (p.notes ? '<p class="small" style="margin-top:.8rem"><strong>Trainer notes:</strong> ' + esc(p.notes) + '</p>' : '') + '</div>';
      }).join('');
    }

    load();
    return { reload: load };
  };
})();
