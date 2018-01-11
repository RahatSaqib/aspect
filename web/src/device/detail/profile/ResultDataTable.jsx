import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../../globals/components/BrowseDataTableHead'
import ResultTableRow from './ResultTableRow'

const RawTable = tableFactory(DataTableHead, ResultTableRow)
export const ResultDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as ResultDataTableHead,
  ResultTableRow as ResultDataTableRow,
}
