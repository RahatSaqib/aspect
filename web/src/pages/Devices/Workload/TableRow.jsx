import React from 'react'
import isNil from 'lodash/isNil'
import { useIntl } from 'react-intl'
import styles from '../../../oldComponents/shared/DataTableRow.module.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../oldComponents/shared/tableBody'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'
import messages from './messages'

const TableRow = ({ item, extraColumns }) => {
  const { formatMessage, format } = useIntl()
  const { dateTimeFormat } = getAspectDisplayPreferences().toJS()
  return (
    <Tr className={styles.TableRow}>
      <Td className={styles.TableCell}>{item.name}</Td>
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
      <Td className={styles.TableCell}>{item.total}</Td>
      {extraColumns.map(col => (
        <Td className={styles.TableCell}>{item[col]}</Td>
      ))}
    </Tr>
  )
}

export default TableRow
