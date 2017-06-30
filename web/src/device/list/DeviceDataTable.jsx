import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import DeviceTableRow from './DeviceTableRow'

const RawTable = tableFactory(DataTableHead, DeviceTableRow)
export const DeviceDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as DeviceDataTableHead,
  DeviceTableRow as DeviceDataTableRow,
}
