import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { useIntl, defineMessages } from 'react-intl'

import PropTypes from 'prop-types'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

const messages = defineMessages({
  moreContacts: {
    id: 'pages.NotificationListRow.moreContacts',
    defaultMessage: 'more contacts',
  },
})

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = identity
const NotificationTableRow = ({
  className,
  key,
  onClick,
  notification: {
    id,
    name,
    lastTriggeredOn,
    totalTriggers,
    contacts,
    contactsCount,
  },
}) => {
  const intl = useIntl()

  const addEllipsis = (words, totalCount) => {
    const wordsArray = words ? words.split(',') : []
    if (wordsArray.length < totalCount)
      return (
        <div>
          {words}...{' '}
          <b>
            {totalCount - wordsArray.length}{' '}
            {intl.formatMessage(messages.moreContacts)}
          </b>
        </div>
      )
    return words
  }

  return (
    <TableRow
      key={key}
      data-notification-id={id}
      onClick={onClick}
      className={cssClasses(className)}
    >
      <TableCell>{name}</TableCell>
      <TableCell>{formatRelative(intl, lastTriggeredOn)}</TableCell>
      <TableCell>{totalTriggers}</TableCell>
      <TableCell className={cssClasses('table__cell, table__cell--truncate')}>
        {addEllipsis(contacts, contactsCount)}
      </TableCell>
    </TableRow>
  )
}

NotificationTableRow.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    lastTriggeredOn: PropTypes.instanceOf(Date),
    totalTriggers: PropTypes.number.isRequired,
    contacts: PropTypes.string.isRequired,
    contactsCount: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  key: PropTypes.number.isRequired,
  className: PropTypes.string,
}

NotificationTableRow.defaultProps = {
  className: '',
}
export default enhance(NotificationTableRow)
