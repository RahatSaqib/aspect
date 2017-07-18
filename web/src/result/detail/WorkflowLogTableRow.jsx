import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const WorkflowLogTableRow = ({ intl, workflowLog, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatDate(workflowLog.get('changedOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {workflowLog.get('statusName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {workflowLog.get('operator')}
    </TableCell>
  </TableRow>

export default enhance(WorkflowLogTableRow)
