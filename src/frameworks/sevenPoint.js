// Seven-Point Story Structure (spec section 12) — Dan Wells' structure,
// built backward from the resolution.
module.exports = {
  name: 'Seven-Point Story Structure',
  category: 'whole_story_structure',
  acts: [
    { name: 'Structure', beats: [
      { name: 'Hook', target_percentage: 1, purpose: "Establish the protagonist's starting state — often the resolution's opposite" },
      { name: 'First Plot Point', target_percentage: 25, purpose: 'Protagonist moves from a reactive to a proactive role' },
      { name: 'First Pinch Point', target_percentage: 37, purpose: 'Apply pressure, often revealing antagonist strength' },
      { name: 'Midpoint', target_percentage: 50, purpose: 'Protagonist shifts from reactive to proactive fully' },
      { name: 'Second Pinch Point', target_percentage: 62, purpose: 'More pressure — things look their worst' },
      { name: 'Second Plot Point', target_percentage: 75, purpose: 'Final piece of information/resource needed for the resolution' },
      { name: 'Resolution', target_percentage: 100, purpose: "Protagonist's growth resolves the story's central conflict" },
    ] },
  ],
};
