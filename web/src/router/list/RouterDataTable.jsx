import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../globals/components/BrowseDataTableHead'
import RouterTableRow from './RouterTableRow'

const RawTable = tableFactory(DataTableHead, RouterTableRow)
export const RouterDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as RouterDataTableHead,
  RouterTableRow as RouterDataTableRow,
}
