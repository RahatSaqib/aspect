import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = _.identity

const NotificationTableRow = ({ intl, notification, ...restProps }) => {
  const counter = column =>
    notification.get(column) === null
      ? 'Not Configured'
      : notification.get(column)
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{notification.get('name')}</TableCell>
      <TableCell>
        {intl.formatRelative(notification.get('lastTriggeredOn'))}
      </TableCell>
      <TableCell>{notification.get('totalTriggers')}</TableCell>
      <TableCell>{counter('alertCount')}</TableCell>
      <TableCell>{counter('smsCount')}</TableCell>
      <TableCell>{counter('emailCount')}</TableCell>
    </TableRow>
  )
}

export default enhance(NotificationTableRow)
