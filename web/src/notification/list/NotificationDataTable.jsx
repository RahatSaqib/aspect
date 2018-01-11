import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../globals/components/BrowseDataTableHead'
import NotificationTableRow from './NotificationTableRow'

const RawTable = tableFactory(DataTableHead, NotificationTableRow)
export const NotificationDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as NotificationDataTableHead,
  NotificationTableRow as NotificationDataTableRow,
}
