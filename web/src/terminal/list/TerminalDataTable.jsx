import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import TerminalTableRow from './TerminalTableRow'

const RawTable = tableFactory(DataTableHead, TerminalTableRow)
export const TerminalDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as TerminalDataTableHead,
  TerminalTableRow as TerminalDataTableRow,
}
