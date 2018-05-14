import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../globals/components/BrowseDataTableHead'
import ReportTableRow from './ReportTableRow'

const RawTable = tableFactory(DataTableHead, ReportTableRow)
export const ReportDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as ReportDataTableHead,
  ReportTableRow as ReportDataTableRow,
}
