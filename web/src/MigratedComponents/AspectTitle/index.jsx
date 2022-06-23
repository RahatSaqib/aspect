import React, { memo } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import styles from './Title.css'

const cssClasses = classnames.bind(styles)

export const Title = memo(({ Icon, title, classNames }) => (
  <div className={cssClasses('title__container')}>
    <Icon />
    <span
      className={cssClasses('title__label', {
        [classNames?.cardTitleText]: !!classNames?.cardTitleText,
      })}
    >
      {title}
    </span>
  </div>
))

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
