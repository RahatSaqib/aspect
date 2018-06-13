import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../../components/shared/DataTableHead'
import NotificationDeliveryTableRow from './NotificationDeliveryTableRow'

const RawTable = tableFactory(DataTableHead, NotificationDeliveryTableRow)
export const NotificationDeliveryDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as NotificationDeliveryDataTableHead,
  NotificationDeliveryTableRow as NotificationDeliveryDataTableRow,
}
