import React, { Fragment } from 'react';
import AspectCard from '../AspectCard';
import Grid from '@material-ui/core/Grid';

const graphs = [
  { id: 1, size: 5, bg: 'pink' },
  { id: 2, size: 7, bg: 'lightblue' }
];

const GraphsContainer = () => (
  <AspectCard title="This is new and shiny" innerSize={9} justify="center">
    <Grid container spacing={8}>
      {graphs.map(g => (
        <Grid item lg={g.size} style={{ background: g.bg }}>
          {g.id}
        </Grid>
      ))}
    </Grid>
  </AspectCard>
);

export default GraphsContainer;
