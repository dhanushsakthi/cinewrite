// Dan Harmon's Story Circle (spec section 14) — an 8-step simplification of
// the Hero's Journey, popular for character-driven and episodic stories.
module.exports = {
  name: "Dan Harmon's Story Circle",
  category: 'whole_story_structure',
  acts: [
    { name: 'Circle', beats: [
      { name: 'You', target_percentage: 5, purpose: 'A character in a zone of comfort' },
      { name: 'Need', target_percentage: 15, purpose: 'But they want something' },
      { name: 'Go', target_percentage: 30, purpose: 'They enter an unfamiliar situation' },
      { name: 'Search', target_percentage: 45, purpose: 'Adapt to it, find what they seek' },
      { name: 'Find', target_percentage: 55, purpose: 'They get what they wanted' },
      { name: 'Take', target_percentage: 70, purpose: 'Pay a heavy price for it' },
      { name: 'Return', target_percentage: 85, purpose: 'Return to their familiar situation' },
      { name: 'Change', target_percentage: 100, purpose: 'Having changed as a result of the journey' },
    ] },
  ],
};
