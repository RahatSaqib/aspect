import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import AlertType from '../../components/shared/AlertType'

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = _.identity

const NotificationTableRow = ({ intl, notification, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      <AlertType alertType={notification.get('alertType')} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {notification.get('alertName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(notification.get('lastTriggeredOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {notification.get('recipientsCount')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {notification.get('triggersCount')}
    </TableCell>
    <TableCell
      className={cssClasses('TableCell', {
        'TableCell--errorsCount': notification.get('errorsCount') > 0,
      })}
    >
      {notification.get('errorsCount')}
    </TableCell>
  </TableRow>
)

export default enhance(NotificationTableRow)
