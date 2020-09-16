import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import PropTypes from 'prop-types'

import { formatDateTime } from '../../../shared/utils/dateFormat'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../../components/shared/tableBody'

const cssClasses = classnames.bind(require('./NotificationHistoryTableRow.css'))

const enhance = identity

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

NotificationHistoryTableRow.propTypes = {
  intl: PropTypes.oneOf(['PropTypes.Object']).isRequired,
  delivery: PropTypes.shape({
    date: PropTypes.string,
    webhookSent: PropTypes.string,
    emailSent: PropTypes.string,
    smsSent: PropTypes.string,
  }).isRequired,
}

export default enhance(NotificationHistoryTableRow)
