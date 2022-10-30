import React from 'react'
import classnames from 'classnames/bind'
import styles from '../../../../components/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../../components/shared/tableBody'
import { formatDate } from '../../../../utils/utils/dateFormat'

const cssClasses = classnames.bind(styles)

const ResultTableRow = ({ result, ...restProps }) => {
  const patientId = result?.get('patientId') || 'N/A'
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{formatDate(result.get('endedOn'))}</TableCell>
      <TableCell>{result.get('sampleOriginSiteName')}</TableCell>
      <TableCell>{result.get('sampleId')}</TableCell>
      <TableCell>{result.get('resultText')}</TableCell>
      <TableCell>{result.get('errorCode')}</TableCell>
      <TableCell>{result.get('resultWorkflowStatus')}</TableCell>
      <TableCell>{patientId}</TableCell>
    </TableRow>
  )
}

export default ResultTableRow
