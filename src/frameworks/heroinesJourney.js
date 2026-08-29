// Heroine's Journey (spec section 2, item 9) — Maureen Murdock's structure,
// framed around reclaiming disowned feminine/masculine aspects rather than
// external conquest; distinct arc shape from the Hero's Journey above.
module.exports = {
  name: "Heroine's Journey",
  category: 'whole_story_structure',
  acts: [
    { name: 'Separation', beats: [
      { name: 'Separation from the Feminine', target_percentage: 10, purpose: 'Protagonist rejects traits coded as weak or limiting' },
      { name: 'Identification with the Masculine', target_percentage: 20, purpose: 'Adopts achievement-oriented values to gain power/approval' },
      { name: 'Road of Trials', target_percentage: 35, purpose: "Accumulates allies and accomplishments in this mode" },
    ] },
    { name: 'Descent', beats: [
      { name: 'Illusory Boon of Success', target_percentage: 45, purpose: 'Achievement feels hollow — success does not satisfy' },
      { name: 'Awakening to Spiritual Poverty', target_percentage: 55, purpose: 'Confronts what was sacrificed along the way' },
      { name: 'Initiation and Descent to the Goddess', target_percentage: 65, purpose: 'Faces deep loss or feminine wound directly' },
    ] },
    { name: 'Return', beats: [
      { name: 'Healing the Mother/Father Split', target_percentage: 78, purpose: 'Reconciles both parental/gendered influences' },
      { name: 'Integration of Masculine and Feminine', target_percentage: 90, purpose: 'Achieves a balanced sense of self' },
      { name: 'Return', target_percentage: 100, purpose: 'Returns to the world whole, on her own terms' },
    ] },
  ],
};
