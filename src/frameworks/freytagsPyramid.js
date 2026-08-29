// Freytag's Pyramid (spec section 17) — five-part dramatic arc visualized as
// a rise-then-fall shape, distinct from the flat Five-Act list above in that
// the UI is expected to render it as a pyramid (see frontend rendering).
module.exports = {
  name: "Freytag's Pyramid",
  category: 'whole_story_structure',
  visual_shape: 'pyramid',
  acts: [
    { name: 'Pyramid', beats: [
      { name: 'Exposition', target_percentage: 10, purpose: 'Background and status quo established' },
      { name: 'Rising Action', target_percentage: 35, purpose: 'Complications build tension toward the climax' },
      { name: 'Climax', target_percentage: 50, purpose: 'The peak — the turning point of the entire story' },
      { name: 'Falling Action', target_percentage: 75, purpose: 'Tension unwinds as consequences play out' },
      { name: 'Resolution (Denouement)', target_percentage: 100, purpose: 'Conflict concludes, new equilibrium established' },
    ] },
  ],
};
