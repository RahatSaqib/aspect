import React from 'react'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import styles from './CardSelectors.css'

const cssClasses = classnames.bind(styles)

const CardSelectors = ({ props: { actionComponentProps, action } }) =>
  actionComponentProps ? (
    <Grid container className={cssClasses('selectors__container')}>
      {actionComponentProps.map(acProps => {
        const { component: Component, identifier, state } = acProps
        return <Component props={acProps} action={action} key={`${identifier}-${state}`} />
      })}
    </Grid>
  ) : null

CardSelectors.propTypes = {
  props: PropTypes.shape({
    actionComponentProps: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object).isRequired, PropTypes.bool]),
    action: PropTypes.func.isRequired,
  }).isRequired,
}

export default CardSelectors
