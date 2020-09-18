import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { useHistory } from 'react-router-dom';

import AspectVertMenu from '../../MigratedComponents/AspectVertMenu'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = identity

const getItemActions = (history) => [
  {
    icon: 'FaEdit',
    text: 'Edit',
    action: (params) => { history.push(`/browse/notification/${params.get('id')}`) }
  },
  {
    icon: 'FaCopy',
    text: 'Copy',
    action: (params) => { console.log('Copy', params) },
    disabled: true
  },
  {
    icon: 'FaEye',
    text: 'Preview',
    action: (params) => { console.log('Preview', params) },
    disabled: true
  },
  {
    icon: 'FaFileAlt',
    text: 'View Log',
    action: (params) => { history.push(`/browse/notification/${params.get('id')}/history`) },
    separator: true
  },
  {
    icon: 'FaTrash',
    text: 'Delete',
    action: (params) => { console.log('Delete', params) },
    disabled: true
  }
]

const NotificationTableRow = ({ intl, notification, ...restProps }) => {
  const history = useHistory()

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
        <AspectVertMenu params={notification} actions={getItemActions(history)} />
      </TableCell>
    </TableRow>
  )
}

export default enhance(NotificationTableRow)
