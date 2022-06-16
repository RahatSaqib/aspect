import React from 'react'
import classnames from 'classnames/bind'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'

import styles from '../../components/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const InventoryLogTableRow = ({ inventoryItem }) => {
  const rowSpan = name => inventoryItem.getIn(['rowSpans', name])

  return (
    <TableRow className={cssClasses('TableRow')}>
      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('createdOn')}
      >
        {inventoryItem.get('createdOn')
          ? formatDate(inventoryItem.get('createdOn'))
          : 'N/A'}
      </TableCell>

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('consumableName')}
      >
        {inventoryItem.get('consumableName')}
      </TableCell>

      {inventoryItem.get('lotNumber') !== undefined ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('lotNumber')}
        >
          {inventoryItem.get('lotNumber')
            ? inventoryItem.get('lotNumber')
            : 'N/A'}
        </TableCell>
      ) : null}

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('expirationDate')}
      >
        <span
          className={
            inventoryItem.get('expirationDate') !== null &&
            new Date(inventoryItem.get('expirationDate')) < new Date()
              ? cssClasses('alert')
              : null
          }
        >
          {inventoryItem.get('expirationDate')
            ? formatDate(inventoryItem.get('expirationDate'))
            : 'N/A'}
        </span>
      </TableCell>

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('siteName')}
      >
        {inventoryItem.get('siteName')}
      </TableCell>

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('quantity')}
      >
        {inventoryItem.get('quantity')}
      </TableCell>

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('consumableReason')}
      >
        {inventoryItem.get('consumableReason')}
      </TableCell>

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('movementReason')}
      >
        {inventoryItem.get('movementReason')}
      </TableCell>

      <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('notes')}>
        {inventoryItem.get('notes')}
      </TableCell>
    </TableRow>
  )
}

export default InventoryLogTableRow
