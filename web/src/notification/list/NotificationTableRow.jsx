import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import AspectVertMenu from '../../MigratedComponents/AspectVertMenu'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = identity

const getItemActions = () => [
  {
    icon: 'FaPause',
    text: 'Pause',
    action: () => { console.log('Pause') }
  },
  {
    icon: 'FaEdit',
    text: 'Edit',
    action: () => { console.log('Edit') }
  },
  {
    icon: 'FaCopy',
    text: 'Copy',
    action: () => { console.log('Copy') }
  },
  {
    icon: 'FaEye',
    text: 'Preview',
    action: () => { console.log('Preview') }
  },
  {
    icon: 'FaFileAlt',
    text: 'View Log',
    action: () => { console.log('View Log') },
    separator: true
  },
  {
    icon: 'FaTrash',
    text: 'Delete',
    action: () => { console.log('Delete') }
  }
]

const NotificationTableRow = ({ intl, notification, ...restProps }) => {
  const counter = column =>
    notification.get(column) === null
      ? 'Not Configured'
      : notification.get(column)

  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{notification.get('name')}</TableCell>
      <TableCell>
        {formatRelative(intl, notification.get('lastTriggeredOn'))}
      </TableCell>
      <TableCell>{notification.get('totalTriggers')}</TableCell>
      <TableCell>{counter('alertCount')}</TableCell>
      <TableCell>{counter('smsCount')}</TableCell>
      <TableCell>{counter('emailCount')}</TableCell>
      <TableCell>
        <AspectVertMenu actions={getItemActions(notification.get('id'))} />
      </TableCell>
    </TableRow>
  )
}

export default enhance(NotificationTableRow)
