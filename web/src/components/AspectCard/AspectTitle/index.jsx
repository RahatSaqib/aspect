import React, { memo } from 'react'
import PropTypes from 'prop-types'
import styles from './Title.module.css'

const Title = memo(({ Icon, title, classNames }) => {
  const classes = `${styles.title__label} ${classNames?.cardTitleText ? styles[classNames?.cardTitleText] : ''}`
  return (
    <div className={styles.title__container}>
      <Icon />
      <span className={classes}>{title}</span>
    </div>
  )
})

Title.defaultProps = {
  Icon: () => null,
  classNames: null,
}

Title.propTypes = {
  Icon: PropTypes.func,
  title: PropTypes.string.isRequired,
  classNames: PropTypes.oneOfType([PropTypes.object]),
}

export default Title
