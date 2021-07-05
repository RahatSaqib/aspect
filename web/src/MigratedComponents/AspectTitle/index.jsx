import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import styles from './Title.css'

const cssClasses = classnames.bind(styles)

export const Title = ({ Icon, title }) => (
  <div className={cssClasses('title__container')}>
    <Icon />
    <span className={cssClasses('title__label')}>{title}</span>
  </div>
)

Title.defaultProps = {
  Icon: () => null,
}

Title.propTypes = {
  Icon: PropTypes.func,
  title: PropTypes.string.isRequired,
}

export default Title
