import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../../globals/components/BrowseDataTableHead'
import ActionTableRow from './ActionTableRow'

const RawTable = tableFactory(DataTableHead, ActionTableRow)
export const ActionDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as ActionDataTableHead,
  ActionTableRow as ActionDataTableRow,
}
