import React from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../oldComponents/shared/tableBody'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const TableRow = ({ item, extraColumns }) => {
  const { formatMessage } = useI18n()
  return (
    <Tr className={cssClasses('TableRow')}>
      <Td className={cssClasses('TableCell')}>{item.name}</Td>
      <Td className={cssClasses('TableCell')}>{formatMessage(messages[item.deviceStatus])}</Td>
      <Td className={cssClasses('TableCell')}>{item.lastPingOn.replace('.000Z', '').split('T').join(' ')}</Td>
      <Td className={cssClasses('TableCell')}>
        {(item.firstResultConductedOn || '').replace('.000Z', '').split('T').join(' ') ||
          formatMessage(messages.notAvailable)}
      </Td>
      <Td className={cssClasses('TableCell')}>
        {(item.lastResultConductedOn || '').replace('.000Z', '').split('T').join(' ') ||
          formatMessage(messages.notAvailable)}
      </Td>
      <Td className={cssClasses('TableCell')}>{item.total}</Td>
      {extraColumns.map(col => (
        <Td className={cssClasses('TableCell')}>{item[col]}</Td>
      ))}

      {/* 
      {item.lotNumber !== undefined ? (
        <Td className={cssClasses('TableCell')}>
          {item.lotNumber ? item.lotNumber : formatMessage(deviceStatusMessages[item.deviceStatus])}
        </Td>
      ) : null}

      <Td className={cssClasses('TableCell')}>
        <span
          className={
            item.expirationDate !== null && new Date(item.expirationDate) < new Date() ? cssClasses('alert') : null
          }
        >
          {item.lastPingOn ? item.lastPingOn.split('T')[0] : formatMessage(deviceStatusMessages.notAvailable)}
        </span>
      </Td>

      <Td className={cssClasses('TableCell')}>{item.quantity}</Td>
      <Td className={cssClasses('TableCell')}>
        {deviceStatusMessages[item.consumableReasonI18nKey]
          ? formatMessage(deviceStatusMessages[item.consumableReasonI18nKey], {
              refSiteName: item.refSiteName ? item.refSiteName : formatMessage(deviceStatusMessages.notAvailable),
            })
          : ''}
      </Td>
      <Td className={cssClasses('TableCell')}>{item.notes}</Td> */}
    </Tr>
  )
}

export default TableRow
