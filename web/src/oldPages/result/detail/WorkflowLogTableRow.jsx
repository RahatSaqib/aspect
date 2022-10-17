import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import styles from '../../components/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import { formatDate } from '../../utils/utils/dateFormat'

const cssClasses = classnames.bind(styles)

const enhance = identity

const WorkflowLogTableRow = ({ workflowLog, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(workflowLog.get('changedOn'))}</TableCell>
    <TableCell>{workflowLog.get('statusName')}</TableCell>
    <TableCell>{workflowLog.get('operator')}</TableCell>
  </TableRow>
)

export default enhance(WorkflowLogTableRow)
