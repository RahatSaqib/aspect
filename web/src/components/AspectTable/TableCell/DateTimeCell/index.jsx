import React from 'react'
import classnames from 'classnames/bind'
import { bool, string, oneOfType } from 'prop-types'
import { useAuthState } from '../../../../providers/AuthProvider'
import { timeAndDate, timeSinceFromUTC } from '../../Helpers'
import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

const DateTimeCellBase = ({ value, flagged, since }) => {
  const { culture } = useAuthState()
  if (!value) return null
  const { isPast, timeSince } = timeSinceFromUTC(value, culture)
  const dateFormatted = timeAndDate(value, 'yyyy-MM-dd hh:mm:ss')

  return (
    <div className={cssClasses(`${isPast && flagged ? 'date__cell--past' : 'date__cell'}`)}>
      {since ? timeSince : dateFormatted}
    </div>
  )
}

DateTimeCellBase.defaultProps = {
  flagged: false,
  since: false,
  value: undefined,
}

DateTimeCellBase.propTypes = {
  value: string,
  flagged: bool,
  since: bool,
}

/**
 * Component to render a date/time cell
 */

const DateTimeCell = ({ value }) => <DateTimeCellBase value={value} />

DateTimeCell.defaultProps = {
  value: false,
}

DateTimeCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: oneOfType([string, bool]),
}

/**
 * Component to render a date since cell
 */

const DateTimeCellSince = ({ value }) => <DateTimeCellBase value={value} since />

DateTimeCellSince.defaultProps = {
  value: false,
}

DateTimeCellSince.propTypes = {
  /**
    Data for the cell to render
  */
  value: oneOfType([string, bool]),
}

/**
 * Component to render a date/time cell with
 * with an indicator for past dates
 */

const DateTimeCellFlagged = ({ value }) => <DateTimeCellBase value={value} flagged since />

DateTimeCell.defaultProps = {
  value: false,
}

DateTimeCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: oneOfType([bool, string]),
}

export { DateTimeCell, DateTimeCellSince, DateTimeCellFlagged }
