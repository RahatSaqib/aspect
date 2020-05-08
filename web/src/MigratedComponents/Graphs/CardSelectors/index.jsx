import React from 'react'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./CardSelectors.css'))

const CardSelectors = ({ props: selectorModifiers }) => {
  return selectorModifiers ? (
    <Grid container className={cssClasses('selectors__container')}>
      {selectorModifiers.map(
        ({ selectedValue, state, component: Component }) => {
          return (
            <Component reduxStateId={state} selectedValue={selectedValue} />
          )
        }
      )}
    </Grid>
  ) : null
}

export default CardSelectors
