import PropTypes from 'prop-types'
import React from 'react'
import classnames from 'classnames/bind'

import styles from './ColoredNumber.css'

const cssClasses = classnames.bind(styles)

const ColoredNumber = ({ number, intl, formatNumberStyle, error, success }) => (
  <span
    className={cssClasses('ColoredNumber', {
      'ColoredNumber--Error': error,
      'ColoredNumber--Success': success,
    })}
  >
    {intl.formatNumber(
      number,
      formatNumberStyle
        ? {
            style: formatNumberStyle,
          }
        : {}
    )}
  </span>
)

ColoredNumber.propTypes = {
  number: PropTypes.number.isRequired,
  intl: PropTypes.func.isRequired,
  formatNumberStyle: PropTypes.string,
  error: PropTypes.bool,
  success: PropTypes.bool,
}
ColoredNumber.defaultProps = {
  formatNumberStyle: null,
  error: false,
  success: false,
}

export default ColoredNumber
