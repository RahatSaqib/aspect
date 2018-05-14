import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../globals/components/BrowseDataTableHead'
import DeviceApiKeyTableRow from './DeviceApiKeyTableRow'

const RawTable = tableFactory(DataTableHead, DeviceApiKeyTableRow)
export const DeviceApiKeyDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as DeviceApiKeyDataTableHead,
  DeviceApiKeyTableRow as DeviceApiKeyDataTableRow,
}
