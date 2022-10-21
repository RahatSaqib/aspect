import React from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import messages from '../../device/list/messages'

const cssClasses = classnames.bind(styles)

const RouterTableRow = ({ router, ...restProps }) => {
  const { formatDistance, formatMessage } = useI18n()
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{router.get('name')}</TableCell>
      <TableCell>{formatMessage(messages[router.get('statusI18nKey')], router.get('approval'))}</TableCell>
      <TableCell>{formatDistance(new Date(router.get('createdOn')), new Date(), true)}</TableCell>
      <TableCell>
        {router.get('lastSeen') ? formatDistance(new Date(router.get('lastSeen')), new Date(), true) : 'N/A'}
      </TableCell>
    </TableRow>
  )
}

export default RouterTableRow
