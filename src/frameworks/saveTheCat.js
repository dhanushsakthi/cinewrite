// Save the Cat Beat Sheet — system framework definition (spec section 3).

module.exports = {
  name: 'Save the Cat',
  acts: [
    {
      name: 'Act 1',
      beats: [
        { name: 'Opening Image', target_percentage: 1, purpose: 'Snapshot of the "before" world' },
        { name: 'Theme Stated', target_percentage: 5, purpose: 'Someone states the theme, protagonist ignores it' },
        { name: 'Setup', target_percentage: 10, purpose: 'Establish protagonist, world, stakes, flaw' },
        { name: 'Catalyst', target_percentage: 12, purpose: 'Life-changing event' },
        { name: 'Debate', target_percentage: 20, purpose: 'Protagonist hesitates' },
        { name: 'Break into Two', target_percentage: 25, purpose: 'Protagonist commits, enters new world' },
      ],
    },
    {
      name: 'Act 2A',
      beats: [
        { name: 'B Story', target_percentage: 30, purpose: 'Secondary story, often carries the theme' },
        { name: 'Fun and Games', target_percentage: 40, purpose: 'The "promise of the premise"' },
        { name: 'Midpoint', target_percentage: 50, purpose: 'False victory or false defeat, stakes raised' },
      ],
    },
    {
      name: 'Act 2B',
      beats: [
        { name: 'Bad Guys Close In', target_percentage: 60, purpose: 'External and internal pressure mounts' },
        { name: 'All Is Lost', target_percentage: 75, purpose: 'Lowest point, often a "whiff of death"' },
        { name: 'Dark Night of the Soul', target_percentage: 77, purpose: 'Protagonist processes the loss' },
      ],
    },
    {
      name: 'Act 3',
      beats: [
        { name: 'Break into Three', target_percentage: 80, purpose: 'New idea/plan emerges from B Story lesson' },
        { name: 'Finale', target_percentage: 90, purpose: 'Protagonist executes plan, resolves conflict' },
        { name: 'Final Image', target_percentage: 100, purpose: 'Mirror/contrast of Opening Image' },
      ],
    },
  ],
};
