// Try-Fail Cycle (spec section 21) — tracks escalating attempts rather than
// a fixed beat count; the writer adds cycles as needed and the AI analyzer
// checks whether failures actually escalate (spec: "analyze whether failures
// escalate appropriately").
module.exports = {
  name: 'Try-Fail Cycle',
  category: 'scene_level',
  flexible_count: true,
  acts: [
    { name: 'Cycle (repeat, escalating)', beats: [
      { name: 'Goal', target_percentage: null, purpose: 'What the protagonist is trying to achieve right now' },
      { name: 'Attempt', target_percentage: null, purpose: 'The concrete action taken toward the goal' },
      { name: 'Failure', target_percentage: null, purpose: 'The attempt does not succeed, or succeeds at a cost' },
      { name: 'New Strategy', target_percentage: null, purpose: 'Protagonist adapts based on what was learned' },
    ] },
  ],
};
