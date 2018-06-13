import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import WorkflowLogTableRow from './WorkflowLogTableRow'

const RawTable = tableFactory(DataTableHead, WorkflowLogTableRow)
export const WorkflowLogDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as WorkflowLogDataTableHead,
  WorkflowLogTableRow as WorkflowLogDataTableRow,
}
