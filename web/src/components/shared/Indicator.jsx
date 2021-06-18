import classnames from 'classnames/bind'
import React from 'react'
import { FaLongArrowAltDown, FaLongArrowAltUp } from 'react-icons/fa'

import styles from './Indicator.css'

const cssClasses = classnames.bind(styles)

const Indicator = ({ indicator, coloredIndicator, isGreaterThan }) =>
  !!indicator && (
    <span
      className={cssClasses('Indicator_Icon', {
        'Indicator_Icon_Colored--less': !!coloredIndicator && !isGreaterThan,
        'Indicator_Icon_Colored--greater': !!coloredIndicator && isGreaterThan,
      })}
    >
      {isGreaterThan ? <FaLongArrowAltUp /> : <FaLongArrowAltDown />}
    </span>
  )

export default Indicator
