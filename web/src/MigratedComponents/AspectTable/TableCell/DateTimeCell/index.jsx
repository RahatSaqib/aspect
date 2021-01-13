import React from 'react'
import classnames from 'classnames/bind'
import { bool, number, oneOfType } from 'prop-types'
import { useIntl } from 'react-intl'

import { timeSinceFromUnix } from '../../Helpers'

const cssClasses = classnames.bind(require('../../Table.css'))

const DateTimeCellBase = ({ value, flagged }) => {
  const { locale } = useIntl()
  const { isPast, timeSince } = timeSinceFromUnix(value, locale)
  return (
    <div
      className={cssClasses(
        `${isPast && flagged ? 'date__cell--past' : 'date__cell'}`
      )}
    >
      {timeSince}
    </div>
  )
}

DateTimeCellBase.defaultProps = {
  flagged: false,
}

DateTimeCellBase.propTypes = {
  value: number.isRequired,
  flagged: bool,
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
  value: oneOfType([number, bool]),
}

/**
 * Component to render a date/time cell with
 * with an indicator for past dates
 */

const DateTimeCellFlagged = ({ value }) => (
  <DateTimeCellBase value={value} flagged />
)

DateTimeCell.defaultProps = {
  value: false,
}

DateTimeCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: oneOfType([bool, number]),
}

export { DateTimeCell, DateTimeCellFlagged }
