import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { FaCircle } from 'react-icons/fa'
import { formatDateTime } from '../../../shared/utils/dateFormat'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../../components/shared/tableBody'

const cssClasses = classnames.bind(require('./NotificationHistoryTableRow.css'))

const enhance = _.identity

const NotificationHistoryTableRow = ({ intl, delivery, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {formatDateTime(delivery.date)}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.webhookSent}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.emailSent}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.smsSent}
    </TableCell>
  </TableRow>
)

export default enhance(NotificationHistoryTableRow)
