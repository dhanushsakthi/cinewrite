// Reaction -> Dilemma -> Decision (spec section 2, item 18) — the "Sequel"
// half of Scene-Sequel, offered standalone for the reflective/consequence
// side of scene construction.
module.exports = {
  name: 'Reaction → Dilemma → Decision',
  category: 'scene_level',
  flexible_count: true,
  acts: [
    { name: 'Sequel', beats: [
      { name: 'Reaction', target_percentage: null, purpose: 'Emotional aftermath of the prior scene' },
      { name: 'Dilemma', target_percentage: null, purpose: 'Weighing imperfect options' },
      { name: 'Decision', target_percentage: null, purpose: 'Commits to a course of action, driving the next scene' },
    ] },
  ],
};
