import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./FlagIcon.css'))

export const FlagIcon = ({ className, style, countryIsoAlpha2Code }) => {
  if (countryIsoAlpha2Code) {
    return (
      <i
        style={style}
        className={cssClasses(
          className,
          'flag-icon',
          `flag-${countryIsoAlpha2Code.toLowerCase()}`
        )}
      />
    )
  }
  return null
}

export default FlagIcon
