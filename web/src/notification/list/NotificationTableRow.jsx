import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const NotificationTableRow = ({ intl, notification, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {notification.get('type')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {notification.get('name')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {notification.get('assignedContacts')}
    </TableCell>
  </TableRow>

export default enhance(NotificationTableRow)
