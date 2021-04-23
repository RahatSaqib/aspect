import classnames from 'classnames/bind'
import React from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const ReporterTableRow = ({ reporter, ...restProps }) => {
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{reporter.get('siteName')}</TableCell>
      <TableCell>{reporter.get('totalResults')}</TableCell>
      <TableCell>{reporter.get('delivered')}</TableCell>
      <TableCell>{reporter.get('requiresTreatment')}</TableCell>
      <TableCell>{reporter.get('onTreatment')}</TableCell>
      <TableCell>{reporter.get('transferred')}</TableCell>
      <TableCell>{reporter.get('notPossible')}</TableCell>
      <TableCell>{reporter.get('notOnTreatment')}</TableCell>
    </TableRow>
  )
}

export default ReporterTableRow
