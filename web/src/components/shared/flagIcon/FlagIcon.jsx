import React from 'react'
import styles from './FlagIcon.css'

export default props =>
  props.countryIsoAlpha2Code
    ? <i
        style={props.style}
        className={`${styles['flag-icon']} ${styles[
          `flag-${props.countryIsoAlpha2Code.toLowerCase()}`
        ]}`}
      />
    : null
