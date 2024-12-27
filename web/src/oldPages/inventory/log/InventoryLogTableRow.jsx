import React from 'react'
import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import styles from '../../../oldComponents/shared/DataTableRow.module.css'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../oldComponents/shared/tableBody'
import { formatDate, formatDateTime } from '../../../utils/utils/dateFormat'
import messages from './messages'

const TEST_CONDUCTED_EXTERNAL_ID = 'used'

const InventoryLogTableRow = ({ inventoryLogItem }) => {
  const { formatMessage } = useIntl()
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const { countryId } = useAuthState()
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

      <TableCell
        className={styles.TableCell}
        onClick={() => {
          if (inventoryLogItem.consumableReasonExternalId === TEST_CONDUCTED_EXTERNAL_ID) {
            addFilter(
              omitBy(
                {
                  countryId,
                  minDate: startOfDay(new Date(inventoryLogItem.resultEndedOn)),
                  maxDate: endOfDay(new Date(inventoryLogItem.resultEndedOn)),
                  assayId: inventoryLogItem.assayId,
                  siteName: inventoryLogItem.siteName,
                },
                isNil
              ),
              '/browse/result'
            )
            navigate('/browse/result')
          }
        }}
        sx={
          inventoryLogItem.consumableReasonExternalId === TEST_CONDUCTED_EXTERNAL_ID
            ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' }
            : {}
        }
      >
        {inventoryLogItem.quantity}
      </TableCell>
      <TableCell className={styles.TableCell}>
        {messages[inventoryLogItem.consumableReasonI18nKey]
          ? formatMessage(messages[inventoryLogItem.consumableReasonI18nKey], {
              refSiteName: inventoryLogItem.refSiteName
                ? inventoryLogItem.refSiteName
                : formatMessage(messages.notAvailable),
            })
          : ''}
      </TableCell>
      <TableCell className={styles.TableCell}>
        {inventoryLogItem.transactionDate
          ? formatDate(inventoryLogItem.transactionDate)
          : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell className={styles.TableCell}>{inventoryLogItem.notes}</TableCell>
      <TableCell className={styles.TableCell}>{inventoryLogItem.reconcilationStrategy}</TableCell>
      <TableCell className={styles.TableCell}>{inventoryLogItem.reconcilationAdjustment}</TableCell>
    </TableRow>
  )
}

export default InventoryLogTableRow
