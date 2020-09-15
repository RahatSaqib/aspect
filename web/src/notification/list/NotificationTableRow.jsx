import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import Badge from '@material-ui/core/Badge'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = _.identity

const NotificationTableRow = ({ intl, notification, ...restProps }) => {
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{notification.name}</TableCell>
      <TableCell>
        {formatRelative(intl, notification.lastTriggeredOn)}
      </TableCell>
      <TableCell>{notification.totalTriggers}</TableCell>
      <TableCell className={cssClasses('TableCell--truncate')}>
        <Badge badgeContent={notification.contactsCount} color="primary" />
        {notification.contactsCount >= 0 ? `   ${notification.contacts}` : ''}
      </TableCell>
    </TableRow>
  )
}

export default enhance(NotificationTableRow)
