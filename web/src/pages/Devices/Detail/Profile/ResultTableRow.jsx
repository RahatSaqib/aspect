import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDate } from '../../../../utils/utils/dateFormat'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../../components/shared/tableBody'

import styles from '../../../../components/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

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

export default enhance(ResultTableRow)
