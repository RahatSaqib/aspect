import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import useI18n from '../../hooks/useI18n'
import styles from './ColoredNumber.css'

const cssClasses = classnames.bind(styles)

const ColoredNumber = ({ number, formatNumberStyle, error, success }) => {
  const { formatNumber } = useI18n()

  return (
    <span
      className={cssClasses('ColoredNumber', {
        'ColoredNumber--Error': error,
        'ColoredNumber--Success': success,
      })}
    >
      {formatNumber(
        number,
        formatNumberStyle
          ? {
              style: formatNumberStyle,
            }
          : {}
      )}
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
