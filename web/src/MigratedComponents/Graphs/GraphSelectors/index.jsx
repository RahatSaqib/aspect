import React from 'react';
import Grid from '@material-ui/core/Grid';
import classnames from 'classnames/bind';

const cssClasses = classnames.bind(require('./GraphSelectors.css'));

const GraphSelectors = ({ selectorModifiers }) => (
  <Grid container className={cssClasses('selectors__container')} spacing={12}>
    {selectorModifiers.map(({ id, state, component: Component }) => {
      return <Component reduxStateId={state} id={id} />;
    })}
  </Grid>
);

export default GraphSelectors;
