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
    action: (params) => { console.log('Pause', params) }
  },
  {
    icon: 'FaEdit',
    text: 'Edit',
    action: (params) => { console.log('Edit', params) }
  },
  {
    icon: 'FaCopy',
    text: 'Copy',
    action: (params) => { console.log('Copy', params) }
  },
  {
    icon: 'FaEye',
    text: 'Preview',
    action: (params) => { console.log('Preview', params) }
  },
  {
    icon: 'FaFileAlt',
    text: 'View Log',
    action: (params) => { console.log('View Log', params) },
    separator: true
  },
  {
    icon: 'FaTrash',
    text: 'Delete',
    action: (params) => { console.log('Delete', params) }
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
        <AspectVertMenu params={notification} actions={getItemActions()} />
      </TableCell>
    </TableRow>
  )
}

export default enhance(NotificationTableRow)
