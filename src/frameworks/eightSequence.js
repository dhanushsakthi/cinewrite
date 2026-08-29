// Eight Sequence Structure (spec section 11) — the classical Hollywood
// "eight ten-to-fifteen-minute reels" approach, mapped proportionally.
module.exports = {
  name: 'Eight Sequence Structure',
  category: 'beat_sheet',
  acts: [
    { name: 'Act I', beats: [
      { name: 'Sequence 1', target_percentage: 12, purpose: 'Setup — establish status quo and protagonist' },
      { name: 'Sequence 2', target_percentage: 25, purpose: 'Inciting incident escalates into the first turning point' },
    ] },
    { name: 'Act II-A', beats: [
      { name: 'Sequence 3', target_percentage: 37, purpose: 'New situation, protagonist pursues a sub-goal' },
      { name: 'Sequence 4', target_percentage: 50, purpose: 'Rising complications lead to the midpoint' },
    ] },
    { name: 'Act II-B', beats: [
      { name: 'Sequence 5', target_percentage: 62, purpose: 'Consequences of the midpoint, raised stakes' },
      { name: 'Sequence 6', target_percentage: 75, purpose: 'Subplots converge, low point approaches' },
    ] },
    { name: 'Act III', beats: [
      { name: 'Sequence 7', target_percentage: 87, purpose: 'Final plan and confrontation begins' },
      { name: 'Sequence 8', target_percentage: 100, purpose: 'Climax and resolution' },
    ] },
  ],
};
