import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import ReporterTableRow from './ReporterTableRow'

const RawTable = tableFactory(DataTableHead, ReporterTableRow)
export const ReporterDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as ReporterDataTableHead,
  ReporterTableRow as ReporterDataTableRow,
}
