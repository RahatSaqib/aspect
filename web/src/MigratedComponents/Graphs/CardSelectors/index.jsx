import React from 'react'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./CardSelectors.css'))

const CardSelectors = ({ props }) => {
  const { actionComponentProps, action } = props
  return actionComponentProps ? (
    <Grid container className={cssClasses('selectors__container')}>
      {actionComponentProps.map(
        ({
          selectedValue,
          state,
          component: Component,
          identifier,
          endpoint,
        }) => {
          return (
            <Component
              reduxStateId={state}
              selectedValue={selectedValue}
              action={action}
              identifier={identifier}
              endpoint={endpoint}
            />
          )
        }
      )}
    </Grid>
  ) : null
}

export default CardSelectors
