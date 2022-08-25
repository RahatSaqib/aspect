import classnames from 'classnames/bind'
import React from 'react'

import styles from './FlagIcon.css'

const cssClasses = classnames.bind(styles)

export const FlagIcon = ({ className, style, countryIsoAlpha2Code }) => {
  if (countryIsoAlpha2Code) {
    return (
      <i style={style} className={cssClasses(className, 'flag-icon', `flag-${countryIsoAlpha2Code.toLowerCase()}`)} />
    )
  }
  return null
}

export default FlagIcon
