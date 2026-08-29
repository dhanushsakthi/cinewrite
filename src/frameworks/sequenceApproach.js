// Sequence Approach (spec section 2, item 13) — a more flexible cousin of
// the Eight Sequence Structure: each sequence is its own mini-story with a
// goal, without prescribing exactly eight of them or fixed page ranges.
module.exports = {
  name: 'Sequence Approach',
  category: 'beat_sheet',
  flexible_count: true,
  acts: [
    { name: 'Sequences (repeat as needed)', beats: [
      { name: 'Sequence Goal', target_percentage: null, purpose: 'What the protagonist wants to achieve in this sequence' },
      { name: 'Sequence Obstacle', target_percentage: null, purpose: 'What stands in the way within this sequence' },
      { name: 'Sequence Turn', target_percentage: null, purpose: 'How this sequence ends — success, failure, or complication that launches the next' },
    ] },
  ],
};
