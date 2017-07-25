import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./FlagIcon.css'))

// add this export option for styleguide
export function FlagIcon(props) {
  if (props.countryIsoAlpha2Code) {
    return (
      <i
        style={props.style}
        className={cssClasses(
          props.className,
          'flag-icon',
          `flag-${props.countryIsoAlpha2Code.toLowerCase()}`
        )}
      />
    )
  }
}

export default props =>
  props.countryIsoAlpha2Code
    ? <i
        style={props.style}
        className={cssClasses(
          props.className,
          'flag-icon',
          `flag-${props.countryIsoAlpha2Code.toLowerCase()}`
        )}
      />
    : null
