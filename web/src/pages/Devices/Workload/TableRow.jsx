import React from 'react'
import isNil from 'lodash/isNil'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import styles from '../../../components/shared/DataTableRow.module.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../components/shared/tableBody'
import messages from './messages'

const TableRow = ({ item, extraColumns, onColumnClick }) => {
  const { formatMessage } = useIntl()

  const formatDateTimeString = dateString => {
    return dateString.replace('T', ' ').substring(0, 16)
  }

  return (
    <Tr style={{ cursor: 'default' }}>
      <Td className={styles.TableCell} onClick={() => onColumnClick({ deviceId: item.deviceId })}>
        <Link to="#"> {item.name}</Link>
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
        {isNil(item.lastPingOn) ? formatMessage(messages.notAvailable) : formatDateTimeString(item.lastPingOn)}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {isNil(item.firstResultEndedOn)
          ? formatMessage(messages.notAvailable)
          : formatDateTimeString(item.firstResultEndedOn)}
      </Td>
      <Td hiddenOn="xl" className={styles.TableCell}>
        {isNil(item.lastResultEndedOn)
          ? formatMessage(messages.notAvailable)
          : formatDateTimeString(item.lastResultEndedOn)}
      </Td>
      <Td onClick={() => onColumnClick({ deviceName: item.name })} className={styles.TableCell}>
        <Link to="#"> {item.total}</Link>
      </Td>
      {extraColumns.map(col => (
        <Td onClick={() => onColumnClick({ deviceName: item.name, fieldId: col })} className={styles.TableCell}>
          <Link to="#">{item[col]}</Link>
        </Td>
      ))}
    </Tr>
  )
}

export default TableRow
