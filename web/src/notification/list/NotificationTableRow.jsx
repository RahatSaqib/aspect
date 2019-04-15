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
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{notification.get('name')}</TableCell>
      <TableCell>
        {intl.formatRelative(notification.get('lastTriggeredOn'))}
      </TableCell>
      <TableCell>{notification.get('triggersCount')}</TableCell>
      <TableCell>{notification.get('issueCount')}</TableCell>
      <TableCell>{notification.get('smsCount')}</TableCell>
      <TableCell>{notification.get('emailCount')}</TableCell>
    </TableRow>
  )
}

export default enhance(NotificationTableRow)
