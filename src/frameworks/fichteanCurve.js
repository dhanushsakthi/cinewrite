// Fichtean Curve (spec section 2, item 8 — "Fichte's Dramatic Structure").
// Note: there is no widely-documented screenwriting framework under the name
// "Fichte's Dramatic Structure"; the closest recognized structure with that
// name root is the Fichtean Curve, a rising-crisis structure that begins in
// medias res and stacks escalating crises with minimal setup. Using that
// definition here — flag this to the user if they meant something else.
module.exports = {
  name: 'Fichtean Curve',
  category: 'whole_story_structure',
  note: 'Interpreted from "Fichte\'s Dramatic Structure" — confirm this matches your intent.',
  acts: [
    { name: 'Structure', beats: [
      { name: 'Crisis 1 (opening in medias res)', target_percentage: 10, purpose: 'Story opens already in conflict, minimal setup' },
      { name: 'Crisis 2', target_percentage: 30, purpose: 'Escalating complication' },
      { name: 'Crisis 3', target_percentage: 50, purpose: 'Further escalation, stakes compound' },
      { name: 'Climax', target_percentage: 80, purpose: 'The highest-stakes crisis, the turning point' },
      { name: 'Resolution', target_percentage: 100, purpose: 'Falling action and denouement, typically brief' },
    ] },
  ],
};
