import React from 'react'
import classnames from 'classnames/bind'
import styles from '../../components/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import { formatDate } from '../../utils/utils/dateFormat'

const cssClasses = classnames.bind(styles)

const WorkflowLogTableRow = ({ workflowLog, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(workflowLog.get('changedOn'))}</TableCell>
    <TableCell>{workflowLog.get('statusName')}</TableCell>
    <TableCell>{workflowLog.get('operator')}</TableCell>
  </TableRow>
)

export default WorkflowLogTableRow
