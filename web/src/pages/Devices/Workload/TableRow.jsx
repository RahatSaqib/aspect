import React from 'react'
import isNil from 'lodash/isNil'
import { useIntl } from 'react-intl'
import { getAspectDisplayPreferences } from '../../../oldComponents/LocalStorage'
import styles from '../../../oldComponents/shared/DataTableRow.module.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../oldComponents/shared/tableBody'
import messages from './messages'

const TableRow = ({ item, extraColumns, onColumnClick }) => {
  const { formatMessage, format } = useIntl()
  const { dateTimeFormat } = getAspectDisplayPreferences().toJS()
  return (
    <Tr className={styles.TableRow}>
      <Td className={styles.TableCell} onClick={() => onColumnClick({ deviceId: item.deviceId })}>
        {item.name}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {item.deviceStatus ? formatMessage(messages[item.deviceStatus]) : formatMessage(messages.notAvailable)}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {item.stateName}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {item.lgaName}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {isNil(item.lastPingOn)
          ? formatMessage(messages.notAvailable)
          : format(new Date(item.lastPingOn), dateTimeFormat)}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {isNil(item.firstResultEndedOn)
          ? formatMessage(messages.notAvailable)
          : format(new Date(item.firstResultEndedOn), dateTimeFormat)}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {isNil(item.lastResultEndedOn)
          ? formatMessage(messages.notAvailable)
          : format(new Date(item.lastResultEndedOn), dateTimeFormat)}
      </Td>
      <Td onClick={() => onColumnClick({ deviceName: item.name })} className={styles.TableCell}>
        {item.total}
      </Td>
      {extraColumns.map(col => (
        <Td onClick={() => onColumnClick({ deviceName: item.name, fieldId: col })} className={styles.TableCell}>
          {item[col]}
        </Td>
      ))}
    </Tr>
  )
}

export default TableRow
