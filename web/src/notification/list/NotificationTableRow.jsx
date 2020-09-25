import classnames from 'classnames/bind'
import React from 'react'
import { useHistory } from 'react-router-dom'
import { useIntl, defineMessages } from 'react-intl'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import AspectVertMenu from '../../MigratedComponents/AspectVertMenu'

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

const NotificationTableRow = ({ notification }) => {
  const intl = useIntl()
  const history = useHistory()

  const getItemActions = history => [
    {
      icon: 'FaEdit',
      text: 'Edit',
      action: params =>
        history.push(`/browse/notification/${params.get('id')}`),
    },
    {
      icon: 'FaCopy',
      text: 'Copy',
      action: params => {
        /* eslint-disable no-debugger, no-console */
        console.log('Copy', params)
      },
      disabled: true,
    },
    {
      icon: 'FaEye',
      text: 'Preview',
      action: params => {
        /* eslint-disable no-debugger, no-console */
        console.log('Preview', params)
      },
      disabled: true,
    },
    {
      icon: 'FaFileAlt',
      text: 'View Log',
      action: params =>
        history.push(`/browse/notification/${params.get('id')}/history`),
      separator: true,
    },
    {
      icon: 'FaTrash',
      text: 'Delete',
      action: params => {
        /* eslint-disable no-debugger, no-console */
        console.log('Delete', params)
      },
      disabled: true,
    },
  ]

  const counter = column =>
    notification.get(column) === null
      ? 'Not Configured'
      : notification.get(column)

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
      key={notification.get('id')}
      data-notification-id={notification.get('id')}
    >
      <TableCell>{notification.get('name')}</TableCell>
      <TableCell>
        {formatRelative(intl, notification.get('lastTriggeredOn'))}
      </TableCell>
      <TableCell>{notification.get('totalTriggers')}</TableCell>
      <TableCell className={cssClasses('table__cell--truncate')}>
        {addEllipsis(
          notification.get('contacts'),
          notification.get('contactsCount')
        )}
      </TableCell>
      <TableCell>{notification.get('totalTriggers')}</TableCell>
      <TableCell>{counter('alertCount')}</TableCell>
      <TableCell>{counter('smsCount')}</TableCell>
      <TableCell>{counter('emailCount')}</TableCell>
      <TableCell>
        <AspectVertMenu
          params={notification}
          actions={getItemActions(history)}
        />
      </TableCell>
    </TableRow>
  )
}

NotificationTableRow.propTypes = {
  notification: PropTypes.instanceOf(Immutable.Map).isRequired,
}

export default NotificationTableRow
