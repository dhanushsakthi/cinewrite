// Five-Act Structure (spec section 16) — classical dramatic structure
// (Freytag's antecedent before his own pyramid visualization).
module.exports = {
  name: 'Five-Act Structure',
  category: 'whole_story_structure',
  acts: [
    { name: 'Exposition', beats: [{ name: 'Exposition', target_percentage: 10, purpose: 'Introduce world, characters, status quo' }] },
    { name: 'Rising Action', beats: [{ name: 'Rising Action', target_percentage: 40, purpose: 'Escalating complications build toward the climax' }] },
    { name: 'Climax', beats: [{ name: 'Climax', target_percentage: 55, purpose: 'The turning point — outcome becomes irreversible' }] },
    { name: 'Falling Action', beats: [{ name: 'Falling Action', target_percentage: 80, purpose: 'Consequences of the climax unfold' }] },
    { name: 'Resolution', beats: [{ name: 'Resolution', target_percentage: 100, purpose: 'New equilibrium, loose ends addressed' }] },
  ],
};
