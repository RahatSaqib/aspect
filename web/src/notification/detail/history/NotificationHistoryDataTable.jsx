import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../../components/shared/DataTableHead'
import NotificationHistoryTableRow from './NotificationHistoryTableRow'

const RawTable = tableFactory(DataTableHead, NotificationHistoryTableRow)
export const NotificationHistoryDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as NotificationHistoryDataTableHead,
  NotificationHistoryTableRow as NotificationHistoryDataTableRow,
}
