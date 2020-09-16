import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

import { defineMessages } from 'react-intl'
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
const NotificationTableRow = ({ intl, notification, ...restProps }) => {
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
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{notification.name}</TableCell>
      <TableCell>
        {formatRelative(intl, notification.lastTriggeredOn)}
      </TableCell>
      <TableCell>{notification.totalTriggers}</TableCell>
      <TableCell className={cssClasses('TableCell--truncate')}>
        {addEllipsis(notification.contacts, notification.contactsCount)}
      </TableCell>
    </TableRow>
  )
}
NotificationTableRow.propTypes = {
  intl: PropTypes.oneOf(['PropTypes.Object']).isRequired,
  location: PropTypes.oneOf(['PropTypes.Object']).isRequired,
  notification: PropTypes.oneOf(['PropTypes.Object']).isRequired,
}
export default enhance(NotificationTableRow)
