import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = _.identity

const NotificationTableRow = ({ intl, notification, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{notification.get('alertName')}</TableCell>
    <TableCell>
      {intl.formatRelative(notification.get('lastTriggeredOn'))}
    </TableCell>
    <TableCell>{notification.get('recipientsCount')}</TableCell>
    <TableCell>{notification.get('triggersCount')}</TableCell>
    <TableCell
      className={cssClasses({
        'TableCell--errorsCount': notification.get('errorsCount') > 0,
      })}
    >
      {notification.get('errorsCount')}
    </TableCell>
    <TableCell>{notification.get('alertName')}</TableCell>
    <TableCell>Not configured</TableCell>
  </TableRow>
)

export default enhance(NotificationTableRow)
