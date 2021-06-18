import React from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'

import styles from './CardSelectors.css'

const cssClasses = classnames.bind(styles)

const CardSelectors = ({ props: { actionComponentProps, action } }) =>
  actionComponentProps ? (
    <Grid container className={cssClasses('selectors__container')}>
      {actionComponentProps.map(props => {
        const { component: Component } = props
        return <Component props={props} action={action} />
      })}
    </Grid>
  ) : null

CardSelectors.propTypes = {
  props: PropTypes.shape({
    actionComponentProps: PropTypes.oneOfType([PropTypes.object]).isRequired,
    action: PropTypes.func.isRequired,
  }).isRequired,
  component: PropTypes.func.isRequired,
}

export default CardSelectors
