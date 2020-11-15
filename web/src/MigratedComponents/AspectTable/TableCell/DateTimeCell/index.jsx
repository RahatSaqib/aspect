import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'

import { timeSinceFromUTC } from '../../Helpers'

const cssClasses = classnames.bind(require('../../Table.css'))

const DateTimeCellBase = ({ value, flagged }) => {
  const { locale } = useIntl()
  const { isPast, timeSince } = timeSinceFromUTC(value, locale)
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
  value: PropTypes.oneOf([PropTypes.array]).isRequired,
  flagged: PropTypes.bool,
}

const DateTimeCell = ({ value }) => <DateTimeCellBase value={value} />

DateTimeCell.defaultProps = {
  value: [],
}

DateTimeCell.propTypes = {
  value: PropTypes.oneOf([PropTypes.array]),
}

const DateTimeCellFlagged = ({ value }) => (
  <DateTimeCellBase value={value} flagged />
)

DateTimeCell.defaultProps = {
  value: [],
}

DateTimeCell.propTypes = {
  value: PropTypes.oneOf([PropTypes.array]),
}

export { DateTimeCell, DateTimeCellFlagged }
