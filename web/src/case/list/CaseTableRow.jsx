import classnames from 'classnames/bind'
import React from 'react'
import messages from './caseMessages'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import useI18n from '../../Hooks/i18n/useI18n'

import styles from '../../components/shared/DataTableRow.css'

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
