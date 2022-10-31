import React from 'react'
import classnames from 'classnames/bind'
import isNil from 'lodash/isNil'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../oldComponents/shared/tableBody'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const TableRow = ({ item, extraColumns }) => {
  const { formatMessage, format } = useI18n()
  const { dateTimeFormat } = getAspectDisplayPreferences().toJS()
  return (
    <Tr className={cssClasses('TableRow')}>
      <Td className={cssClasses('TableCell')}>{item.name}</Td>
      <Td className={cssClasses('TableCell')}>{formatMessage(messages[item.deviceStatus])}</Td>
      <Td className={cssClasses('TableCell')}>{item.stateName}</Td>
      <Td className={cssClasses('TableCell')}>{item.lgaName}</Td>
      <Td className={cssClasses('TableCell')}>
        {isNil(item.lastPingOn)
          ? formatMessage(messages.notAvailable)
          : format(new Date(item.lastPingOn), dateTimeFormat)}
      </Td>
      <Td className={cssClasses('TableCell')}>
        {isNil(item.firstResultEndedOn)
          ? formatMessage(messages.notAvailable)
          : format(new Date(item.firstResultEndedOn), dateTimeFormat)}
      </Td>
      <Td className={cssClasses('TableCell')}>
        {isNil(item.lastResultEndedOn)
          ? formatMessage(messages.notAvailable)
          : format(new Date(item.lastResultEndedOn), dateTimeFormat)}
      </Td>
      <Td className={cssClasses('TableCell')}>{item.total}</Td>
      {extraColumns.map(col => (
        <Td className={cssClasses('TableCell')}>{item[col]}</Td>
      ))}
    </Tr>
  )
}

export default TableRow
