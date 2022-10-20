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
      {extraColumns.map(col => (
        <Td className={cssClasses('TableCell')}>{item[col]}</Td>
      ))}
      <Td className={cssClasses('TableCell')}>{item.total}</Td>
    </Tr>
  )
}

export default TableRow
