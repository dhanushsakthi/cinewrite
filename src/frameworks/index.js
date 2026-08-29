// Framework registry (spec section 21). Adding a new system framework means
// adding a file + one line here — routes never need to know framework names.

const threeAct = require('./threeAct');
const saveTheCat = require('./saveTheCat');
const heroJourney = require('./heroJourney');
const fiveAct = require('./fiveAct');
const sevenPoint = require('./sevenPoint');
const danHarmonStoryCircle = require('./danHarmonStoryCircle');
const kishotenketsu = require('./kishotenketsu');
const eightSequence = require('./eightSequence');
const freytagsPyramid = require('./freytagsPyramid');
const heroinesJourney = require('./heroinesJourney');
const virginsPromise = require('./virginsPromise');
const fichteanCurve = require('./fichteanCurve');
const sequenceApproach = require('./sequenceApproach');
const tryFailCycle = require('./tryFailCycle');
const sceneSequel = require('./sceneSequel');
const goalConflictDisaster = require('./goalConflictDisaster');
const reactionDilemmaDecision = require('./reactionDilemmaDecision');

const REGISTRY = {
  // Whole story structures
  'three-act': { ...threeAct, category: threeAct.category || 'whole_story_structure' },
  'five-act': fiveAct,
  'heros-journey': heroJourney,
  'seven-point': sevenPoint,
  'freytags-pyramid': freytagsPyramid,
  'dan-harmon-story-circle': danHarmonStoryCircle,
  'kishotenketsu': kishotenketsu,
  'fichtean-curve': fichteanCurve,
  'heroines-journey': heroinesJourney,
  'virgins-promise': virginsPromise,

  // Beat sheets / screenplay-level structures
  'save-the-cat': { ...saveTheCat, category: saveTheCat.category || 'beat_sheet' },
  'eight-sequence': eightSequence,
  'sequence-approach': sequenceApproach,

  // Scene-level structures
  'scene-sequel': sceneSequel,
  'goal-conflict-disaster': goalConflictDisaster,
  'reaction-dilemma-decision': reactionDilemmaDecision,
  'try-fail-cycle': tryFailCycle,
};

function listFrameworks() {
  return Object.entries(REGISTRY).map(([key, def]) => ({
    key,
    name: def.name,
    category: def.category || 'beat_sheet',
    note: def.note || null,
  }));
}

function getFramework(key) {
  return REGISTRY[key] || null;
}

// Combining frameworks (spec section 2: "Three Act + Save the Cat") — merges
// Save the Cat's beats into the Three Act act structure by nearest percentage,
// tagging each beat with its originating framework so the UI can show both.
function combineFrameworks(keys) {
  const defs = keys.map(getFramework).filter(Boolean);
  if (defs.length === 0) return null;
  if (defs.length === 1) return defs[0];

  const combinedName = defs.map((d) => d.name).join(' + ');
  const allBeats = defs.flatMap((d, i) =>
    d.acts.flatMap((act) =>
      act.beats.map((b) => ({ ...b, source_framework: d.name, source_act: act.name }))
    )
  );
  allBeats.sort((a, b) => (a.target_percentage || 0) - (b.target_percentage || 0));

  return {
    name: combinedName,
    acts: [{ name: 'Combined Timeline', beats: allBeats }],
  };
}

module.exports = { listFrameworks, getFramework, combineFrameworks, REGISTRY };
