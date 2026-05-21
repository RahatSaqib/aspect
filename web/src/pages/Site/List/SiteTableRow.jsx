import React from 'react'
import { useIntl } from 'react-intl'
import styles from '../../../components/shared/DataTableRow.module.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../components/shared/tableBody'
import { formatRelative } from '../../../utils/utils/dateFormat'

const SiteTableRow = ({ site, onAlertClick, ...restProps }) => {
  const { formatRelativeTime } = useIntl()
  return (
    <TableRow {...restProps} className={styles[restProps.className]}>
      <TableCell>{site.name}</TableCell>
      <TableCell>{site.state}</TableCell>
      <TableCell>{site.lga}</TableCell>
      <TableCell>{site.externalId}</TableCell>
      <TableCell>{site.totalDevices}</TableCell>
      <TableCell>{site.siteConsumableCount}</TableCell>
      <TableCell>{site.siteType}</TableCell>
      <TableCell>{site.parentWarehouseName}</TableCell>
      <TableCell>{formatRelative(site.inventoryUpdatedOn, formatRelativeTime, 'N/A')}</TableCell>
    </TableRow>
  )
}

export default SiteTableRow
