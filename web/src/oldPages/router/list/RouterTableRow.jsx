import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import messages from '../../device/list/messages'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import useI18n from '../../../hooks/useI18n'

import styles from '../../../oldComponents/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

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

export default enhance(RouterTableRow)
