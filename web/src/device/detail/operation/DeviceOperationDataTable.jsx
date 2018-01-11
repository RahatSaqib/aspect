import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../../globals/components/BrowseDataTableHead'
import DeviceOperationTableRow from './DeviceOperationTableRow'

const RawTable = tableFactory(DataTableHead, DeviceOperationTableRow)
export const DeviceOperationDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as DeviceOperationDataTableHead,
  DeviceOperationTableRow as DeviceOperationDataTableRow,
}
