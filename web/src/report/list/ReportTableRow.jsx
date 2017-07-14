import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ReportTableRow = ({ intl, report, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {report.get('deploymentName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {report.get('moduleSerial')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {report.get('dateOfError')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {report.get('error')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {report.get('totalTestsRun')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {report.get('totalErrors')}
    </TableCell>
  </TableRow>

export default enhance(ReportTableRow)
