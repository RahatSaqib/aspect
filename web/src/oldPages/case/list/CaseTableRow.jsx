import React from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import messages from './caseMessages'

const cssClasses = classnames.bind(styles)

const CaseTableRow = ({ _case, ...restProps }) => {
  const { formatDate, formatMessage } = useI18n()
  const patientId = _case?.get('patientId') || 'N/A'
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{formatDate(_case.get('createdOn'))}</TableCell>
      <TableCell>{_case.get('externalId')}</TableCell>
      <TableCell>{_case.get('sampleOriginSite')}</TableCell>
      <TableCell>{patientId}</TableCell>
      <TableCell>{formatMessage(messages[_case.get('diseaseI18nKey')], _case.get('diseaseName'))}</TableCell>
      <TableCell>{_case.get('status')}</TableCell>
    </TableRow>
  )
}

export default CaseTableRow
