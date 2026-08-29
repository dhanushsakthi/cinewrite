// Scene-Sequel Method (spec section 20) — Dwight Swain's scene-level unit:
// a Scene (Goal -> Conflict -> Disaster) followed by a Sequel (Reaction ->
// Dilemma -> Decision) that turns the disaster into the next scene's goal.
module.exports = {
  name: 'Scene-Sequel Method',
  category: 'scene_level',
  flexible_count: true,
  acts: [
    { name: 'Scene', beats: [
      { name: 'Goal', target_percentage: null, purpose: "The point-of-view character's objective entering the scene" },
      { name: 'Conflict', target_percentage: null, purpose: 'Obstacles that resist the goal' },
      { name: 'Disaster', target_percentage: null, purpose: 'The scene ends worse than it started — goal denied or complicated' },
    ] },
    { name: 'Sequel', beats: [
      { name: 'Reaction', target_percentage: null, purpose: 'Emotional response to the disaster' },
      { name: 'Dilemma', target_percentage: null, purpose: 'No good options are immediately available' },
      { name: 'Decision', target_percentage: null, purpose: 'A choice is made, becoming the next scene\'s Goal' },
    ] },
  ],
};
