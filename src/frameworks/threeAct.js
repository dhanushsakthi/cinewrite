// Three Act Structure — system framework definition (spec section 3).
// Shape matches what the "frameworks" table stores in its `configuration` JSONB
// column, so this file's export can be inserted as a seed row verbatim.

module.exports = {
  name: 'Three Act Structure',
  acts: [
    {
      name: 'Act 1',
      target_percentage_of_runtime: 25,
      beats: [
        { name: 'Setup', target_percentage: 0, purpose: 'Establish world, protagonist, status quo' },
        { name: 'Inciting Incident', target_percentage: 10, purpose: 'Disrupts the status quo' },
        { name: 'Plot Point 1', target_percentage: 25, purpose: 'Protagonist commits to the journey' },
      ],
    },
    {
      name: 'Act 2',
      target_percentage_of_runtime: 50,
      beats: [
        { name: 'Rising Action', target_percentage: 37, purpose: 'Obstacles escalate, subplots develop' },
        { name: 'Midpoint', target_percentage: 50, purpose: 'Major shift — false victory/defeat, stakes raised' },
        { name: 'Complications & Higher Stakes', target_percentage: 62, purpose: 'Pressure mounts on protagonist' },
        { name: 'Plot Point 2', target_percentage: 75, purpose: 'Low point / all is lost, launches Act 3' },
      ],
    },
    {
      name: 'Act 3',
      target_percentage_of_runtime: 25,
      beats: [
        { name: 'Climax', target_percentage: 90, purpose: 'Central conflict resolved' },
        { name: 'Resolution', target_percentage: 100, purpose: 'New status quo, theme affirmed' },
      ],
    },
  ],
};
