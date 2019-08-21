import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaCircle from 'react-icons/lib/fa/circle'
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
    <TableCell
      className={cssClasses('TableCell', {
        'TableCell--hasError': delivery.emailError > 0 || delivery.smsError > 0,
      })}
    >
      {(delivery.emailError > 0 || delivery.smsError > 0) && (
        <FaCircle className={cssClasses('FaCircle')} />
      )}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {formatDateTime(delivery.date)}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.webCount}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.emailCount}
    </TableCell>
    <TableCell
      className={cssClasses('TableCell', {
        'TableCell--hasError': delivery.emailError > 0,
      })}
    >
      {delivery.emailError}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.smsCount}
    </TableCell>
    <TableCell
      className={cssClasses('TableCell', {
        'TableCell--hasError': delivery.smsError > 0,
      })}
    >
      {delivery.smsError}
    </TableCell>
  </TableRow>
)

export default enhance(NotificationHistoryTableRow)
