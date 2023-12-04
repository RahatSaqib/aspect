import React from 'react'
import useAuthState from '../../../../hooks/useAuthState'
import { timeSinceFromUTC } from '../../Helpers'
import styles from '../../Table.module.css'

/**
 * Component to render a date/time cell with
 * with an indicator for past dates
 */

const DateTimeCellFlagged = ({ value }) => {
  const { culture } = useAuthState()
  if (!value) return null
  const { isPast, timeSince } = timeSinceFromUTC(value, culture)

  return <div className={`${isPast ? styles.date__cell__past : styles.date__cell}`}>{timeSince}</div>
}

export { DateTimeCellFlagged }
