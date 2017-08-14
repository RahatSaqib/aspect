import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import TaskTableRow from './TaskTableRow'

const RawTable = tableFactory(DataTableHead, TaskTableRow)
export const TaskDataTable = themr(TABLE)(RawTable)

export { DataTableHead as TaskDataTableHead, TaskTableRow as TaskDataTableRow }
