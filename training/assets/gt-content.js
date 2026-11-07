/* lil' bird Guide Training — public course structure (safe to ship to the browser).
 * Teaching text lives in src/learn/<ID>.md (built into GTLearn).
 * Questions and answer keys live in src/items/<ID>.js (server-side only).
 */
var GTContent = (function () {
  var PARTS = [
    { id: 'foundations', label: 'Part 1', title: 'Foundations' },
    { id: 'intensive', label: 'Part 2', title: 'The Intensive, lived and learned' },
    { id: 'room', label: 'Part 3', title: 'Running the room' },
    { id: 'accreditation', label: 'Part 4', title: 'Accreditation' },
  ];

  var MODULES = [
    // ── Part 1 ──
    { id: 'F1', part: 'foundations', title: "The lil' bird way", liveIt: false, hasCheck: true, checkSize: 8,
      heart: 'What do we believe about people, and how does that shape every session?',
      summary: "My bias is you. The whole person. The two-degree shift. You can't give what you don't have.",
      practice: 'Orientation call: watch Luke model a 20-minute session, then name the convictions you saw at work.' },
    { id: 'F2', part: 'foundations', title: 'The coaching posture', liveIt: false, hasCheck: true, checkSize: 8,
      heart: 'How do you guide without leading someone by the leash?',
      summary: 'From passive mirror to active signpost. Open questions, follow the heat, silence, "Did I get that right?", advice in your pocket.',
      practice: 'Circle 1: the opening 10 minutes, and the rhythm of an open question followed by "Did I get that right?"' },
    { id: 'F3', part: 'foundations', title: 'Edges and guardrails', liveIt: false, hasCheck: true, checkSize: 8, crisisModule: true,
      heart: 'Where does coaching stop, and what do you do when you reach that edge?',
      summary: 'Coaching vs therapy. The crisis disclosure script (US and AU). Faith and faith-hurt. Medical, legal and financial scope.',
      practice: 'Circle 2 (with Story): naming the edge between coaching and therapy.' },

    // ── Part 2 ──
    { id: 'I1', part: 'intensive', title: 'Opening: Life Canvas and Inner Compass', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'Where is this person right now, and how are they wired?',
      summary: 'Building relational capital. Reading a profile without boxing someone in.',
      practice: 'Circle 1: debrief a peer\'s Life Canvas using only questions.' },
    { id: 'I2', part: 'intensive', title: 'Story', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'Where have you come from, and can you look back at all of it, the good, the bad and the ugly, with enough gratitude to move forward?',
      summary: 'Gratitude without denial. Holding vulnerability. Where story turns into therapy.',
      practice: 'Circle 2 triads, 10-minute rounds. The client tells one low-stakes chapter. The coach practises the opening disclaimer, one "what I\'m hearing underneath" reflection in the client\'s own words, and the gratitude question.' },
    { id: 'I3', part: 'intensive', title: 'Vision', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'What do you want for your life, and how would it feel if it never happened?',
      summary: 'An intoxicating vision without a gap that crushes. "If nothing changed…"',
      practice: 'Circle 2: run the "if everything went well" and "if nothing changed" pair on a peer.' },
    { id: 'I4', part: 'intensive', title: 'Identity', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'Who are you, by default, when nobody needs anything from you?',
      summary: 'Nature, nurture, energisers and drainers. Following the threads.',
      practice: 'Circle 3: reflecting what\'s underneath, in the client\'s own words.' },
    { id: 'I5', part: 'intensive', title: 'Transitions', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'What are you moving through, and do you need to clarify, explore or decide?',
      summary: 'Clarify, explore or decide. The "easy way out / afraid of / need to" options question.',
      practice: 'Circle 3: the options question on a real, low-stakes choice.' },
    { id: 'I6', part: 'intensive', title: 'Life Rhythms', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'What does your week actually look like, and what needs cutting or adding?',
      summary: 'Current vs ideal week. Rest, whimsy, rigidity.',
      practice: 'Circle 4: asking the same question again, gently, until you believe the answer.' },
    { id: 'I7', part: 'intensive', title: 'Relationships', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'How are your key relationships doing, and what is it like to be on the other side of you?',
      summary: 'A health check on key relationships, current and hoped-for. How do people experience you?',
      practice: 'Circle 4: specific encouragement versus pushing in.' },
    { id: 'I8', part: 'intensive', title: 'Integration: the flight plan', liveIt: true, hasCheck: true, checkSize: 8,
      heart: 'What were the ahas, and what will you put in place so the growth continues?',
      summary: 'Making breakthroughs stick. What comes after the Intensive.',
      practice: 'Circle 5: the last 15 minutes, landing a real action step.' },

    // ── Part 3 ──
    { id: 'R1', part: 'room', title: 'Session architecture', liveIt: false, hasCheck: true, checkSize: 8,
      heart: 'What has to happen at the start, middle and end of every session?',
      summary: 'The first 10 minutes. Contracting. The last 10 to 15 minutes on the action step. Checking in without a report card. How much homework.',
      practice: 'Coach one peer through a full session outside the call; log it as a triad.' },
    { id: 'R2', part: 'room', title: 'The people you coach', liveIt: false, hasCheck: true, checkSize: 8,
      heart: 'What is really going on, what is the first question, and what trap do you avoid?',
      summary: "Luke's 10 archetypes: the burning-out high achiever, the scared mid-career quitter, the new parent, \"just tell me what to do\", the sceptic, post-ministry, and more.",
      practice: 'Circle 5: warm-up rounds, one archetype each.' },
    { id: 'R3', part: 'room', title: 'Coaching a group', liveIt: false, hasCheck: true, checkSize: 8,
      heart: 'How do you hold a room so the group does the work?',
      summary: 'Holding a group. The Life Canvas group story. Letting the group do the work.',
      practice: 'Co-facilitate the check-in or debrief on a group call.' },

    // ── Part 4 ──
    { id: 'C1', part: 'accreditation', title: 'Practicum', liveIt: false, hasCheck: false, practicum: true,
      heart: 'Can you coach the lil\' bird way with a real person while a trainer watches?',
      summary: 'Two observed coaching sessions with a volunteer client, scored on the guide rubric.',
      practice: '' },
    { id: 'C2', part: 'accreditation', title: 'Final assessment and sign-off', liveIt: false, hasCheck: false, final: true,
      heart: 'Pulling it all together.',
      summary: '40 scenario-heavy items from every module. Pass at 85% with no harmful picks. Then a sign-off conversation.',
      practice: '' },
  ];

  var CALLS = [
    { id: 'call-1', week: 1, title: 'Orientation', focus: 'Meet the cohort; how triads work; Luke models a 20-minute session' },
    { id: 'call-2', week: 3, title: 'Circle 1', focus: 'Opening 10 minutes; open question plus "Did I get that right?"' },
    { id: 'call-3', week: 5, title: 'Circle 2', focus: 'Holding a story; naming the edge from coaching into therapy' },
    { id: 'call-4', week: 7, title: 'Circle 3', focus: 'Reflecting what\'s underneath; the options question' },
    { id: 'call-5', week: 9, title: 'Circle 4', focus: 'Specific encouragement vs pushing in; asking the same question again' },
    { id: 'call-6', week: 11, title: 'Circle 5', focus: 'The last 15 minutes: landing a real action step' },
    { id: 'call-7', week: 14, title: 'Graduation', focus: 'Each graduate names their two-degree shift from the course' },
  ];

  // Observer's log for a triad round.
  var TRIAD_LOG = [
    { id: 'contract', q: 'Did the coach set expectations or agree a focus early on?', kind: 'yesno' },
    { id: 'open', q: 'Roughly how many open questions did the coach ask?', kind: 'number' },
    { id: 'closed', q: 'Roughly how many closed questions?', kind: 'number' },
    { id: 'underneath', q: 'At least one reflection of what\'s underneath, in the client\'s own words?', kind: 'yesno' },
    { id: 'step', q: 'Did it end on a step the client chose?', kind: 'yesno' },
    { id: 'note', q: 'One thing the coach did well (optional)', kind: 'text' },
  ];

  var RUBRIC = [
    { id: 'opening', label: 'Opening and contracting', low: 'Dives in cold; no clear topic by minute 10', high: 'Relational capital built and topic agreed by minute 10' },
    { id: 'questions', label: 'Questions', low: 'Mostly closed or leading', high: 'Open question, then "Did I get that right?", as a rhythm' },
    { id: 'listening', label: 'Listening underneath', low: 'Repeats words back only', high: 'Names what might be underneath, tentatively, in the client\'s words' },
    { id: 'advice', label: 'Advice discipline', low: 'Gives advice unasked', high: 'Advice kept in the pocket; offered only when asked, hat clearly off' },
    { id: 'honesty', label: 'Encouragement and honesty', low: 'Only cheerleads, or only confronts', high: 'Encouragement is specific and real; asks a hard question again when needed' },
    { id: 'step', label: 'Action step', low: 'Ends without one, or the coach chose it', high: 'The client\'s step: specific, with a day, worked on for the last 10 to 15 minutes' },
    { id: 'guardrails', label: 'Guardrails (if one came up)', low: 'Kept coaching through a therapy or crisis cue', high: 'Paused, named it kindly, followed the script' },
  ];

  return { PARTS: PARTS, MODULES: MODULES, CALLS: CALLS, TRIAD_LOG: TRIAD_LOG, RUBRIC: RUBRIC };
})();
if (typeof module !== 'undefined') module.exports = GTContent;
