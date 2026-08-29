// Structured learning content (spec sections 6-10, 31-32).
// "Core framework definitions should be stored as structured verified
// content" — this is that store, seeded for Save the Cat's 15 beats and
// Three Act's stages first (the two frameworks the existing app already
// uses), with the rest of the registry left for the AI-grounded fallback
// in learning.controller.js until each is authored here too.
//
// AI explanations are grounded against this content (never invents
// terminology) per spec section 32.

const SAVE_THE_CAT = {
  'Opening Image': {
    definition: 'A snapshot of the protagonist and world before the story\'s transformation begins — the "before" picture.',
    purpose: 'Gives the audience a visual/emotional baseline to measure change against by the Final Image.',
    typical_function: 'Often shows the protagonist\'s flaw or limitation in miniature, without announcing it as a flaw yet.',
    writer_questions: [
      'What single image or moment captures who my protagonist is right now?',
      'What will this image contrast with by the Final Image?',
    ],
    common_mistakes: [
      'Treating it as generic scene-setting instead of a deliberate "before" snapshot.',
      'Making it so subtle the contrast with the Final Image is lost on the audience.',
    ],
    example: 'A locksmith who only unlocks doors for other people, never her own front door — she sleeps in her car outside the apartment she owns but won\'t enter.',
    relation_notes: 'Mirrored (not repeated) by the Final Image at the story\'s end.',
  },
  'Theme Stated': {
    definition: 'Someone other than the protagonist states the story\'s underlying theme aloud, usually in passing.',
    purpose: 'Plants the lesson early so its payoff at the climax feels earned rather than sudden.',
    typical_function: 'The protagonist usually dismisses or misunderstands it — they are not ready to hear it yet.',
    writer_questions: [
      'What is my story actually about, beneath the plot?',
      'Who could say this to my protagonist in a way that feels natural, not preachy?',
    ],
    common_mistakes: [
      'Making the line so on-the-nose it reads as the writer speaking, not a character.',
      'Skipping it, so the theme never re-surfaces at the climax with any setup.',
    ],
    example: 'A mentor tells the protagonist, "You can\'t fix a house you\'re not willing to live in," which she brushes off as nonsense.',
    relation_notes: 'Often echoed or reversed near the Finale once the protagonist has learned it.',
  },
  'Setup': {
    definition: 'The section establishing the protagonist\'s world, flaw, supporting cast, and what\'s missing from their life.',
    purpose: 'Gives the audience enough investment in the status quo that its disruption (the Catalyst) has weight.',
    typical_function: 'Introduces stakes-in-waiting: things that will matter once the plot starts moving.',
    writer_questions: [
      'What does my protagonist need to change, and how do I show that need without stating it?',
      'What relationships or routines will the Catalyst disrupt?',
    ],
    common_mistakes: [
      'Spending too long here without forward momentum — Setup should still feel like it\'s going somewhere.',
      'Introducing plot elements that never pay off later.',
    ],
    example: null,
    relation_notes: 'Everything planted here should be available for the Catalyst and later beats to use.',
  },
  'Catalyst': {
    definition: "The life-changing event that disrupts the protagonist's status quo and starts the story moving.",
    purpose: 'Forces the protagonist to eventually leave their comfort zone — the story literally cannot proceed without it.',
    typical_function: 'Often external and sudden — a piece of news, an arrival, an accident — something the protagonist did not choose.',
    writer_questions: [
      'What is the one thing my protagonist could not have predicted that changes everything?',
      'Is my Catalyst genuinely disruptive, or just mildly inconvenient?',
    ],
    common_mistakes: [
      'Confusing the Catalyst with the Inciting Incident of other frameworks — in Save the Cat specifically, the Catalyst is the disruption; Break into Two is the commitment. They are not the same beat.',
      'Making the Catalyst too easily reversible, so the stakes feel low.',
    ],
    example: 'A wedding invitation arrives from the ex the protagonist never got closure with.',
    relation_notes: 'Triggers the Debate — the protagonist doesn\'t act on it immediately.',
  },
  'Debate': {
    definition: "The protagonist's hesitation before committing to the journey the Catalyst has opened up.",
    purpose: "Shows the cost of both staying and going, so the eventual commitment (Break into Two) means something.",
    typical_function: "Raises the question the story will spend its second act answering: should they go through with it?",
    writer_questions: [
      'What does my protagonist stand to lose by acting, and by not acting?',
      'What finally tips them into commitment?',
    ],
    common_mistakes: [
      'Making the hesitation last so long it stalls momentum.',
      'Removing the choice entirely, so Break into Two feels forced rather than chosen.',
    ],
    example: null,
    relation_notes: 'Resolves directly into Break into Two.',
  },
  'Break into Two': {
    definition: 'The protagonist actively chooses to leave the old world and enter the new situation the story is really about.',
    purpose: 'Marks the shift from a reactive protagonist to one making an active choice — the "point of no return."',
    typical_function: 'Often a physical departure or a clear declaration of intent.',
    writer_questions: [
      'Is this a genuine choice, or is my protagonist just being swept along by events?',
      'What makes this the moment they cannot easily turn back?',
    ],
    common_mistakes: [
      'Having outside forces make the choice for the protagonist, weakening their agency.',
    ],
    example: null,
    relation_notes: 'Opens Act Two and the B Story that runs through it.',
  },
  'B Story': {
    definition: "A secondary storyline, often a relationship, that runs parallel to the main plot (the A Story) and usually carries the story's theme.",
    purpose: 'Gives the theme a place to live outside the main plot\'s action, and gives the protagonist a space to be vulnerable in ways the A Story doesn\'t allow.',
    typical_function: 'Frequently a mentor, love interest, or friend who embodies or teaches the theme through their relationship with the protagonist.',
    writer_questions: [
      "Who can my protagonist be honest with in a way the main plot doesn't allow?",
      'How does this relationship reflect or comment on the theme stated earlier?',
      "Does my story actually need a B Story, or would that relationship dilute focus?",
    ],
    common_mistakes: [
      "Treating the B Story as a disconnected subplot instead of a thematic mirror of the A Story.",
      'Introducing the B Story character too late for the relationship to carry weight.',
    ],
    example: 'While investigating a case (A Story), the detective\'s growing friendship with a witness (B Story) is what actually teaches him to trust people again — the story\'s theme.',
    relation_notes: 'The B Story character often delivers or embodies the lesson the protagonist needs to resolve the A Story.',
  },
  'Fun and Games': {
    definition: 'The section that delivers on the premise — the trailer-moment material the story was "sold" on.',
    purpose: "Rewards the audience with the experience they came for, exploring the story's central conceit before complications intensify.",
    typical_function: "Often the most purely entertaining stretch, lower on plot pressure and higher on tone/voice.",
    writer_questions: [
      'What did I promise the audience in my premise, and am I delivering it here?',
      'Am I exploring the concept, or just stalling before the midpoint?',
    ],
    common_mistakes: [
      'Treating this as filler rather than the section audiences often remember most.',
    ],
    example: null,
    relation_notes: 'Builds toward the Midpoint, where the stakes shift from exploration to consequence.',
  },
  'Midpoint': {
    definition: "A major shift roughly halfway through the story — often a false victory or false defeat — that raises the stakes.",
    purpose: 'Prevents the middle from sagging by forcing a change in the protagonist\'s approach or understanding.',
    typical_function: 'Can be external (a public triumph/disaster) or internal (a realization); either way, "the fun and games" ends and real consequences begin.',
    writer_questions: [
      'Is my midpoint a false victory or a false defeat — and have I made that choice deliberately?',
      'What changes about the stakes or the protagonist\'s understanding after this point?',
    ],
    common_mistakes: [
      'A midpoint that doesn\'t actually change anything — just another complication rather than a turn.',
    ],
    example: null,
    relation_notes: 'Raises the stakes that Bad Guys Close In will then apply pressure against.',
  },
  'Bad Guys Close In': {
    definition: 'Internal and external pressure mounts on the protagonist following the Midpoint.',
    purpose: 'Escalates tension steadily toward the low point of All Is Lost.',
    typical_function: 'Doubt creeps in, alliances fray, the antagonist (literal or circumstantial) gains ground.',
    writer_questions: [
      'What is going wrong externally, and what is going wrong internally, at the same time?',
      "Are my protagonist's flaws actively making things worse here?",
    ],
    common_mistakes: [
      'Only escalating external plot pressure while the internal/emotional pressure stays flat.',
    ],
    example: null,
    relation_notes: 'Builds directly to All Is Lost.',
  },
  'All Is Lost': {
    definition: "The lowest point of the story — the protagonist's goal appears completely out of reach.",
    purpose: "Creates the deepest possible pressure right before the protagonist's true transformation, so the eventual turnaround has maximum contrast.",
    typical_function: 'Often includes a "whiff of death" — literal or symbolic — signaling something has truly ended.',
    writer_questions: [
      'What has my protagonist actually lost here, not just risked?',
      'Does this feel like a genuine low point, or a temporary setback?',
    ],
    common_mistakes: [
      'Making the low point too easily reversible, undercutting the stakes.',
    ],
    example: null,
    relation_notes: 'Triggers the Dark Night of the Soul.',
  },
  'Dark Night of the Soul': {
    definition: "The protagonist's moment of processing the loss from All Is Lost, before finding the way forward.",
    purpose: 'Gives the emotional low point room to be felt, so the eventual insight that launches Act Three feels earned.',
    typical_function: 'Often quiet and reflective — the calm after the low point, not more plot action.',
    writer_questions: [
      'What does my protagonist need to sit with before they can move forward?',
      'What insight emerges from this reflection that leads to Break into Three?',
    ],
    common_mistakes: [
      'Skipping this beat entirely, making the pivot into Act Three feel unearned.',
    ],
    example: null,
    relation_notes: 'The insight found here is what powers Break into Three.',
  },
  'Break into Three': {
    definition: "The protagonist commits to a new plan, informed by what the B Story has taught them.",
    purpose: 'Synthesizes the A Story\'s plot problem with the B Story\'s thematic lesson into one final approach.',
    typical_function: 'Often the moment the theme, finally internalized, becomes actionable.',
    writer_questions: [
      'What has the B Story taught my protagonist that they can now apply to the A Story?',
    ],
    common_mistakes: [
      "A plan that doesn't actually draw on anything learned earlier — arbitrary rather than earned.",
    ],
    example: null,
    relation_notes: 'Launches the Finale.',
  },
  'Finale': {
    definition: "The protagonist executes the new plan and resolves the story's central conflict.",
    purpose: 'Demonstrates the protagonist\'s change through action, not just statement.',
    typical_function: 'Usually the longest, most complex beat — often broken into its own mini five-point structure (gathering the team, storming the castle, etc.).',
    writer_questions: [
      'Does my protagonist win using the new understanding, or the same old flawed approach?',
      'Are all setups from earlier acts paying off here?',
    ],
    common_mistakes: [
      'A resolution that relies on luck or outside help rather than the protagonist\'s own growth.',
    ],
    example: null,
    relation_notes: 'Resolves the A Story and confirms the theme.',
  },
  'Final Image': {
    definition: 'A snapshot mirroring the Opening Image, showing how much has changed.',
    purpose: 'Gives the audience visual/emotional proof of the transformation the story just tracked.',
    typical_function: "Should rhyme with the Opening Image specifically — same type of moment, opposite meaning.",
    writer_questions: [
      'Does this image directly answer the Opening Image, or is it just "a nice ending shot"?',
    ],
    common_mistakes: [
      'An ending image with no visual/thematic connection back to the opening.',
    ],
    example: 'The locksmith unlocks her own front door and walks inside.',
    relation_notes: 'The mirror/contrast of the Opening Image.',
  },
};

const THREE_ACT = {
  'Setup': {
    definition: 'Establishes the world, protagonist, and status quo before the story\'s central conflict begins.',
    purpose: 'Gives the audience a baseline to understand what the Inciting Incident disrupts.',
    typical_function: 'Introduces the protagonist\'s ordinary life, key relationships, and unspoken want or flaw.',
    writer_questions: ['What does my protagonist\'s life look like before everything changes?'],
    common_mistakes: ['Spending too long here without forward momentum.'],
    example: null,
    relation_notes: 'Sets up everything the Inciting Incident and Plot Point 1 will disrupt.',
  },
  'Inciting Incident': {
    definition: "The event that disrupts the story's status quo and sets the plot in motion.",
    purpose: 'Gives the protagonist a problem or opportunity they cannot ignore.',
    typical_function: "Often external and outside the protagonist's control.",
    writer_questions: ['What is the one event my protagonist could not have predicted?'],
    common_mistakes: ['An incident so minor the audience doesn\'t register it as a turning point.'],
    example: null,
    relation_notes: 'Leads into the protagonist\'s decision at Plot Point 1.',
  },
  'Plot Point 1': {
    definition: 'The moment the protagonist commits to the journey, ending Act One.',
    purpose: 'Marks the shift from reactive to active — the story now has direction.',
    typical_function: 'Often involves crossing a literal or figurative threshold into a new situation.',
    writer_questions: ['What makes this commitment feel like a genuine, difficult choice?'],
    common_mistakes: ['Having the choice made for the protagonist by outside forces.'],
    example: null,
    relation_notes: 'Opens Act Two.',
  },
  'Midpoint': {
    definition: 'A major shift roughly halfway through the story that raises the stakes or changes the protagonist\'s understanding.',
    purpose: 'Prevents the middle from sagging by forcing a change in direction or stakes.',
    typical_function: 'Often a false victory or false defeat.',
    writer_questions: ['What changes about the stakes after this point?'],
    common_mistakes: ['A midpoint that doesn\'t actually change anything.'],
    example: null,
    relation_notes: 'Escalates pressure toward Plot Point 2.',
  },
  'Plot Point 2': {
    definition: "The story's low point, often where all seems lost, launching the final act.",
    purpose: 'Creates maximum pressure right before the resolution, so the climax has the highest possible stakes.',
    typical_function: 'Often involves the loss of something the protagonist believed they needed to succeed.',
    writer_questions: ['What has my protagonist genuinely lost here?'],
    common_mistakes: ['A low point that is too easily reversible.'],
    example: null,
    relation_notes: 'Launches Act Three and the Climax.',
  },
  'Climax': {
    definition: "The story's central conflict is resolved through direct confrontation or action.",
    purpose: 'Demonstrates the protagonist\'s growth through action.',
    typical_function: 'The highest-stakes, most decisive sequence of the story.',
    writer_questions: ['Does my protagonist win using what they\'ve learned, or the same flawed approach as before?'],
    common_mistakes: ['A resolution driven by luck rather than the protagonist\'s own choices.'],
    example: null,
    relation_notes: 'Resolves into the Resolution.',
  },
  'Resolution': {
    definition: 'The new status quo after the climax, with loose ends addressed.',
    purpose: 'Confirms the change the story tracked and gives the audience closure.',
    typical_function: 'Often mirrors the Setup to show contrast.',
    writer_questions: ['How is this world/protagonist different from where we started?'],
    common_mistakes: ['Leaving major questions unresolved without intention.'],
    example: null,
    relation_notes: 'Mirrors the Setup.',
  },
};

// framework_key -> { stage_name -> content }
const LIBRARY = {
  'save-the-cat': SAVE_THE_CAT,
  'three-act': THREE_ACT,
};

function getStructuredLearningContent(frameworkKey, stageName) {
  return LIBRARY[frameworkKey]?.[stageName] || null;
}

function getAllStructuredContent(frameworkKey) {
  return LIBRARY[frameworkKey] || null;
}

module.exports = { getStructuredLearningContent, getAllStructuredContent, LIBRARY };
