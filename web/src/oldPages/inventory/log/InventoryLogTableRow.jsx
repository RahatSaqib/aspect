import React from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import { formatDateTime } from '../../../utils/utils/dateFormat'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const InventoryLogTableRow = ({ inventoryLogItem }) => {
  const { formatMessage } = useI18n()
  return (
    <TableRow className={cssClasses('TableRow')}>
      <TableCell className={cssClasses('TableCell')}>
        {inventoryLogItem.createdOn ? formatDateTime(inventoryLogItem.createdOn) : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell className={cssClasses('TableCell')}>{inventoryLogItem.siteName}</TableCell>
      <TableCell className={cssClasses('TableCell')}>
        {messages[inventoryLogItem.consumableNameI18nKey]
          ? formatMessage(messages[inventoryLogItem.consumableNameI18nKey])
          : inventoryLogItem.consumableName}
      </TableCell>

      {inventoryLogItem.lotNumber !== undefined ? (
        <TableCell className={cssClasses('TableCell')}>
          {inventoryLogItem.lotNumber ? inventoryLogItem.lotNumber : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}

      <TableCell className={cssClasses('TableCell')}>
        <span
          className={
            inventoryLogItem.expirationDate !== null && new Date(inventoryLogItem.expirationDate) < new Date()
              ? cssClasses('alert')
              : null
          }
        >
          {inventoryLogItem.expirationDate
            ? inventoryLogItem.expirationDate.split('T')[0]
            : formatMessage(messages.notAvailable)}
        </span>
      </TableCell>

      <TableCell className={cssClasses('TableCell')}>{inventoryLogItem.quantity}</TableCell>
      <TableCell className={cssClasses('TableCell')}>
        {messages[inventoryLogItem.consumableReasonI18nKey]
          ? formatMessage(messages[inventoryLogItem.consumableReasonI18nKey], {
              refSiteName: inventoryLogItem.refSiteName,
            })
          : ''}
      </TableCell>
      <TableCell className={cssClasses('TableCell')}>{inventoryLogItem.notes}</TableCell>
    </TableRow>
  )
}

export default InventoryLogTableRow
