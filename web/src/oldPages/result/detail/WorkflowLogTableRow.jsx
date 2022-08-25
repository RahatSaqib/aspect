import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import { formatDate } from '../../utils/utils/dateFormat'

import styles from '../../components/shared/DataTableRow.css'

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
