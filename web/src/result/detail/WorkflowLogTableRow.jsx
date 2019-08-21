import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const WorkflowLogTableRow = ({ intl, workflowLog, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(workflowLog.get('changedOn'))}</TableCell>
    <TableCell>{workflowLog.get('statusName')}</TableCell>
    <TableCell>{workflowLog.get('operator')}</TableCell>
  </TableRow>
)

export default enhance(WorkflowLogTableRow)
