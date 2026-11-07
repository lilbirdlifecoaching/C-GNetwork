/* lil' bird Guide Training — shared core logic.
 * Pure functions only: no DOM, no storage. The same file runs in the browser
 * (demo backend) and in Google Apps Script (copied into Training.gs by build.py),
 * so scoring and accreditation rules live in exactly one place.
 */
var GTCore = (function () {
  var RULES = {
    passPct: 0.8,            // module checks
    finalPassPct: 0.85,      // C2 final assessment
    finalSize: 40,           // items drawn for the final
    callsRequired: 5,        // of 7 group calls
    triadsRequired: 6,       // confirmed triad rounds as coach
    practicumsRequired: 2,
    practicumPassAvg: 3,     // rubric average, 1–4
  };

  var WEIGHTS = { best: 3, acceptable: 1, weak: 0, harmful: 0 };

  // Max points an item can earn.
  function itemMax(item) {
    if (item.type === 'scenario') return 3;
    if (item.type === 'short_answer') return 0; // trainer-marked, outside the auto score
    return 1;
  }

  // Strip answer keys before an item goes to the browser.
  // Options are shuffled each time; each keeps its original index in `i`, which is what gets scored.
  function publicItem(item, rand) {
    var opts = (item.options || []).map(function (o, i) { return { i: i, text: o.text }; });
    return {
      id: item.id, moduleId: item.moduleId, type: item.type,
      prompt: item.prompt, transcript: item.transcript || null,
      options: item.keepOrder ? opts : shuffle(opts, rand || Math.random),
    };
  }

  // Score one answer. choice = option index (or text for short answers).
  function scoreAnswer(item, choice) {
    if (item.type === 'short_answer') {
      return { itemId: item.id, choice: String(choice || ''), points: 0, max: 0, pending: true, harmful: false };
    }
    var opt = item.options[choice];
    if (!opt) return { itemId: item.id, choice: choice, points: 0, max: itemMax(item), harmful: false, missing: true };
    var points, verdict, harmful = false;
    if (item.type === 'scenario') {
      verdict = opt.weight;                 // best | acceptable | weak | harmful
      points = WEIGHTS[verdict] || 0;
      harmful = verdict === 'harmful';
    } else {
      verdict = opt.correct ? 'correct' : 'incorrect';
      points = opt.correct ? 1 : 0;
    }
    var bestIndex = -1;
    item.options.forEach(function (o, i) { if (o.correct || o.weight === 'best') bestIndex = i; });
    return {
      itemId: item.id, choice: choice, points: points, max: itemMax(item),
      verdict: verdict, harmful: harmful, bestIndex: bestIndex,
      rationale: opt.rationale || '', itemRationale: item.rationale || '',
      crisis: !!item.crisis, crisisMet: item.crisis ? (verdict === 'best' || verdict === 'correct') : true,
    };
  }

  // Score a whole attempt. items: full items (with keys); answers: {itemId: choice}.
  function scoreAttempt(items, answers, isFinal) {
    var results = items.map(function (it) { return scoreAnswer(it, answers[it.id]); });
    var points = 0, max = 0, harmful = [], crisisMissed = false;
    results.forEach(function (r) {
      points += r.points; max += r.max;
      if (r.harmful) harmful.push(r.itemId);
      if (!r.crisisMet) crisisMissed = true;
    });
    var pct = max ? points / max : 0;
    var need = isFinal ? RULES.finalPassPct : RULES.passPct;
    var passed = pct >= need && harmful.length === 0 && !crisisMissed;
    return { results: results, points: points, max: max, pct: pct, need: need,
             harmful: harmful, crisisMissed: crisisMissed, passed: passed };
  }

  // Draw n items from a pool, preferring items not seen in the previous attempt.
  // rand: optional () => [0,1) for testability.
  function drawItems(pool, n, lastSeenIds, rand) {
    rand = rand || Math.random;
    var seen = {}; (lastSeenIds || []).forEach(function (id) { seen[id] = true; });
    var fresh = shuffle(pool.filter(function (i) { return !seen[i.id]; }), rand);
    var stale = shuffle(pool.filter(function (i) { return seen[i.id]; }), rand);
    // Crisis items are always included when the module has them.
    var crisis = pool.filter(function (i) { return i.crisis; });
    var picked = crisis.slice();
    fresh.concat(stale).forEach(function (i) {
      if (picked.length < n && picked.indexOf(i) === -1) picked.push(i);
    });
    return shuffle(picked, rand);
  }

  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Can this trainee start a check now? A retake needs Learn it reopened after the last failed try.
  function canAttempt(progress, lastAttempt) {
    if (!progress || !progress.learnOpenedAt) return { ok: false, reason: 'Open Learn it first.' };
    if (lastAttempt && !lastAttempt.passed && lastAttempt.submittedAt &&
        !(progress.learnOpenedAt > lastAttempt.submittedAt)) {
      return { ok: false, reason: 'Re-read Learn it before your retake. It unlocks once you reopen it.' };
    }
    return { ok: true };
  }

  function practicumPassed(p) {
    var vals = Object.keys(p.scores || {}).map(function (k) { return Number(p.scores[k]); }).filter(function (v) { return v > 0; });
    if (!vals.length) return false;
    var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    if (vals.some(function (v) { return v === 1; })) return false;
    if (p.guardrailCameUp && Number(p.scores.guardrails) !== 4) return false;
    return avg >= RULES.practicumPassAvg;
  }

  // Accreditation gates. modules: content list; s: the trainee's summary.
  function computeGates(modules, s) {
    var checkMods = modules.filter(function (m) { return m.hasCheck; });
    var liveMods = modules.filter(function (m) { return m.liveIt; });
    var passedChecks = checkMods.filter(function (m) { return s.progress[m.id] && s.progress[m.id].checkPassedAt; }).length;
    var liveDone = liveMods.filter(function (m) { return s.progress[m.id] && s.progress[m.id].liveItDone; }).length;
    var calls = (s.callsAttended || []).length;
    var triads = (s.triads || []).filter(function (t) { return t.role === 'coach' && t.confirmedAt; }).length;
    var pracs = (s.practicums || []).filter(practicumPassed).length;
    var gates = [
      { id: 'checks', label: 'Every module check passed', have: passedChecks, need: checkMods.length },
      { id: 'liveit', label: 'All Live it sessions done (content stays private)', have: liveDone, need: liveMods.length },
      { id: 'calls', label: 'Group calls attended or made up', have: calls, need: RULES.callsRequired },
      { id: 'triads', label: 'Triad rounds as coach, confirmed by an observer', have: triads, need: RULES.triadsRequired },
      { id: 'practicum', label: 'Observed practicum sessions passed', have: pracs, need: RULES.practicumsRequired },
      { id: 'final', label: 'Final assessment passed', have: s.finalPassedAt ? 1 : 0, need: 1 },
      { id: 'flags', label: 'No open flags', have: (s.openFlags || 0) === 0 ? 1 : 0, need: 1 },
    ];
    gates.forEach(function (g) { g.met = g.have >= g.need; });
    return { gates: gates, ready: gates.every(function (g) { return g.met; }) };
  }

  return {
    RULES: RULES, publicItem: publicItem, scoreAnswer: scoreAnswer, scoreAttempt: scoreAttempt,
    drawItems: drawItems, canAttempt: canAttempt, computeGates: computeGates,
    practicumPassed: practicumPassed, itemMax: itemMax,
  };
})();
if (typeof module !== 'undefined') module.exports = GTCore;
