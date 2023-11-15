import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import styles from './ColoredNumber.module.css'

const ColoredNumber = ({ number, formatNumberStyle, error, success }) => {
  const { formatNumber } = useIntl()

  return (
    <span
      className={`${styles.ColoredNumber} ${error ? styles.ColoredNumber__Error : ''} ${
        success ? styles.ColoredNumber__Success : ''
      }`}
    >
      {formatNumber(number, formatNumberStyle ? { style: formatNumberStyle } : {})}
    </span>
  )
}

ColoredNumber.propTypes = {
  number: PropTypes.number.isRequired,
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
