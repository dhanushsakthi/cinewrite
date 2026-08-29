// Kishōtenketsu (spec section 15) — a four-part East Asian narrative
// structure that does NOT center on conflict; the "twist" (ten) recontextualizes
// rather than escalates confrontation. Explicitly not forced into Three-Act shape.
module.exports = {
  name: 'Kishōtenketsu',
  category: 'whole_story_structure',
  conflict_centered: false,
  acts: [
    { name: 'Structure', beats: [
      { name: 'Ki (Introduction)', target_percentage: 25, purpose: 'Establish characters, setting, situation — no conflict required' },
      { name: 'Shō (Development)', target_percentage: 50, purpose: 'Develop the introduced elements further, no major complication needed' },
      { name: 'Ten (Twist)', target_percentage: 75, purpose: 'An unexpected, often unrelated element recontextualizes what came before' },
      { name: 'Ketsu (Conclusion)', target_percentage: 100, purpose: 'Resolution that reconciles the twist with the earlier material' },
    ] },
  ],
};
