import classnames from 'classnames/bind'
import React from 'react'
import FaLongArrowDown from 'react-icons/lib/fa/long-arrow-down'
import FaLongArrowUp from 'react-icons/lib/fa/long-arrow-up'

const cssClasses = classnames.bind(require('./Indicator.css'))

const Indicator = ({ indicator, coloredIndicator, isGreaterThan }) =>
  !!indicator && (
    <span
      className={cssClasses('Indicator_Icon', {
        'Indicator_Icon_Colored--less': !!coloredIndicator && !isGreaterThan,
        'Indicator_Icon_Colored--greater': !!coloredIndicator && isGreaterThan,
      })}
    >
      {isGreaterThan ? <FaLongArrowUp /> : <FaLongArrowDown />}
    </span>
  )

export default Indicator
