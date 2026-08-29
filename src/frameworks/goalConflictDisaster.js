// Goal -> Conflict -> Disaster (spec section 2, item 17) — the "Scene" half
// of Scene-Sequel, offered standalone for writers who just want the action
// side without necessarily building matching Sequels for every scene.
module.exports = {
  name: 'Goal → Conflict → Disaster',
  category: 'scene_level',
  flexible_count: true,
  acts: [
    { name: 'Scene', beats: [
      { name: 'Goal', target_percentage: null, purpose: 'What the character wants in this scene' },
      { name: 'Conflict', target_percentage: null, purpose: 'What opposes that want' },
      { name: 'Disaster', target_percentage: null, purpose: 'The scene turns worse, not better' },
    ] },
  ],
};
