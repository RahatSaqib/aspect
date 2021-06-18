import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import styles from './Title.css'

const cssClasses = classnames.bind(styles)

export const Title = ({ icon, title }) => (
  <div className={cssClasses('title__container')}>
    {icon}
    <span className={cssClasses('title__label')}>{title}</span>
  </div>
)

Title.defaultProps = {
  icon: () => false,
}

Title.defaultProps = {
  icon: PropTypes.func,
  title: PropTypes.string.isRequired,
}

export default Title
