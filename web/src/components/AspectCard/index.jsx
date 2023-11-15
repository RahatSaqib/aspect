import React from 'react'
import { Card, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import styles from './Card.module.css'

const CardHeader = ({ props }) => {
  const { title, actionComponent, action, classNames } = props
  const { component: ActionComponent, props: actionComponentProps } = actionComponent

  return title || actionComponent ? (
    <Grid item xs={12}>
      <Grid container spacing={1} className={styles.card__headerContainer}>
        {title ? (
          <Grid item xs={6} className={styles.card__title}>
            <div className={styles.title__container}>
              <span
                className={`${styles.title__label} ${
                  classNames?.cardTitleText ? styles[classNames?.cardTitleText] : ''
                }`}
              >
                {title}
              </span>
            </div>
          </Grid>
        ) : null}
        {actionComponent ? (
          <Grid item xs={6} className={styles.card__actionsContainer}>
            <ActionComponent props={{ actionComponentProps, action }} />
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  ) : null
}

const AspectCard = ({ children, classNames, justify, innerSize, title, actionComponent, action, name }) => {
  return (
    <Card className={styles.card__container} name={name}>
      <Grid container justifyContent={justify} className={styles.card__grid}>
        <CardHeader props={{ title, actionComponent, action, classNames }} />
        <Grid item xs={12} lg={innerSize} className={styles.card__content}>
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
