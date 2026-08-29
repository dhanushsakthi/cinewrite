// Hero's Journey — whole-story structure (spec section 13). Stages are
// individually optional per spec ("do not assume every story needs every
// stage") — the `is_optional` flag reflects that; the UI/generation logic
// should let the writer drop stages rather than treating this as rigid.

module.exports = {
  name: "Hero's Journey",
  category: 'whole_story_structure',
  acts: [
    {
      name: 'Departure',
      beats: [
        { name: 'Ordinary World', target_percentage: 1, purpose: "Establish the hero's normal life before change" },
        { name: 'Call to Adventure', target_percentage: 8, purpose: 'A disruption presents a challenge or quest' },
        { name: 'Refusal of the Call', target_percentage: 12, purpose: 'Hero hesitates, fear or reluctance surfaces', is_optional: true },
        { name: 'Meeting the Mentor', target_percentage: 15, purpose: 'Hero gains guidance, tools, or confidence', is_optional: true },
        { name: 'Crossing the Threshold', target_percentage: 20, purpose: 'Hero commits and enters the unfamiliar world' },
      ],
    },
    {
      name: 'Initiation',
      beats: [
        { name: 'Tests, Allies, Enemies', target_percentage: 35, purpose: 'Hero learns the rules of the new world' },
        { name: 'Approach to the Inmost Cave', target_percentage: 45, purpose: 'Preparation before the central ordeal' },
        { name: 'Ordeal', target_percentage: 50, purpose: "Hero faces their greatest fear — a life-or-death crisis" },
        { name: 'Reward (Seizing the Sword)', target_percentage: 60, purpose: 'Hero gains something from surviving the ordeal' },
      ],
    },
    {
      name: 'Return',
      beats: [
        { name: 'The Road Back', target_percentage: 75, purpose: 'Hero commits to finishing the journey, consequences chase them' },
        { name: 'Resurrection', target_percentage: 90, purpose: 'Final, most dangerous test — a climactic transformation' },
        { name: 'Return with the Elixir', target_percentage: 100, purpose: 'Hero returns changed, bringing something of value back' },
      ],
    },
  ],
};
