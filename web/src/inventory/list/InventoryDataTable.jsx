import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import InventoryTableRow from './InventoryTableRow'

const RawTable = tableFactory(DataTableHead, InventoryTableRow)
export const InventoryDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as InventoryDataTableHead,
  InventoryTableRow as InventoryDataTableRow,
}
