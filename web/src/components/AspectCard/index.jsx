import React from 'react'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import AspectTitle from '../AspectTitle'
import styles from './Card.css'

const cssClasses = classnames.bind(styles)

const CardHeader = ({ props }) => {
  const { title, actionComponent, action, classNames } = props
  const { component: ActionComponent, props: actionComponentProps } = actionComponent

  return title || actionComponent ? (
    <Grid item xs={12}>
      <Grid container spacing={24} className={cssClasses('card__headerContainer')}>
        {title ? (
          <Grid item xs={6} className={cssClasses('card__title')}>
            <AspectTitle title={title} classNames={classNames} />
          </Grid>
        ) : null}
        {actionComponent ? (
          <Grid item xs={6} className={cssClasses('card__actionsContainer')}>
            <ActionComponent props={{ actionComponentProps, action }} />
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  ) : null
}

const AspectCard = ({ children, classNames, justify, innerSize, title, actionComponent, action, name }) => {
  return (
    <Card className={cssClasses('card__container')} name={name}>
      <Grid container justifyContent={justify} className={cssClasses('card__grid')}>
        <CardHeader props={{ title, actionComponent, action, classNames }} />
        <Grid item xs={12} lg={innerSize} className={cssClasses('card__content')}>
          {children}
        </Grid>
      </Grid>
    </Card>
  )
}

AspectCard.defaultProps = {
  justify: 'center',
  innerSize: 12,
  name: null,
  classNames: null,
}

AspectCard.protoTypes = {
  children: PropTypes.oneOfType([PropTypes.object]).isRequired,
  classNames: PropTypes.oneOfType([PropTypes.object]),
  justify: PropTypes.string,
  innerSize: PropTypes.instanceOf,
  title: PropTypes.string.isRequired,
  name: PropTypes.string,
}

export default AspectCard
