import React from 'react'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.module.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import { formatDateTime } from '../../../utils/utils/dateFormat'
import messages from './messages'

const InventoryLogTableRow = ({ inventoryLogItem }) => {
  const { formatMessage } = useI18n()
  return (
    <TableRow className={styles.TableRow}>
      <TableCell className={styles.TableCell}>
        {inventoryLogItem.createdOn ? formatDateTime(inventoryLogItem.createdOn) : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell className={styles.TableCell}>{inventoryLogItem.siteName}</TableCell>
      <TableCell className={styles.TableCell}>
        {messages[inventoryLogItem.consumableNameI18nKey]
          ? formatMessage(messages[inventoryLogItem.consumableNameI18nKey])
          : inventoryLogItem.consumableName}
      </TableCell>

      {inventoryLogItem.lotNumber !== undefined ? (
        <TableCell className={styles.TableCell}>
          {inventoryLogItem.lotNumber ? inventoryLogItem.lotNumber : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}

      <TableCell className={styles.TableCell}>
        <span
          className={
            inventoryLogItem.expirationDate !== null && new Date(inventoryLogItem.expirationDate) < new Date()
              ? styles.alert
              : null
          }
        >
          {inventoryLogItem.expirationDate
            ? inventoryLogItem.expirationDate.split('T')[0]
            : formatMessage(messages.notAvailable)}
        </span>
      </TableCell>

      <TableCell className={styles.TableCell}>{inventoryLogItem.quantity}</TableCell>
      <TableCell className={styles.TableCell}>
        {messages[inventoryLogItem.consumableReasonI18nKey]
          ? formatMessage(messages[inventoryLogItem.consumableReasonI18nKey], {
              refSiteName: inventoryLogItem.refSiteName
                ? inventoryLogItem.refSiteName
                : formatMessage(messages.notAvailable),
            })
          : ''}
      </TableCell>
      <TableCell className={styles.TableCell}>{inventoryLogItem.notes}</TableCell>
    </TableRow>
  )
}

export default InventoryLogTableRow
