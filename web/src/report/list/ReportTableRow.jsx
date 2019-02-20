import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ReportTableRow = ({ intl, report, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{report.get('deploymentName')}</TableCell>
    <TableCell>{report.get('moduleSerial')}</TableCell>
    <TableCell>{report.get('dateOfError')}</TableCell>
    <TableCell>{report.get('error')}</TableCell>
    <TableCell>{report.get('totalTestsRun')}</TableCell>
    <TableCell>{report.get('totalErrors')}</TableCell>
  </TableRow>
)

export default enhance(ReportTableRow)
