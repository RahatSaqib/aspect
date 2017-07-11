import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import PersonTableRow from './PersonTableRow'

const RawTable = tableFactory(DataTableHead, PersonTableRow)
export const PersonDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as PersonDataTableHead,
  PersonTableRow as PersonDataTableRow,
}
