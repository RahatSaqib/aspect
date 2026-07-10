import React from 'react'
import styles from '../../../components/shared/DataTableRow.module.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../components/shared/tableBody'

const SiteTableRow = ({ site, onAlertClick, ...restProps }) => {
  return (
    <TableRow {...restProps} className={styles[restProps.className]}>
      <TableCell>{site.name}</TableCell>
      <TableCell>{site.state}</TableCell>
      <TableCell>{site.lga}</TableCell>
      <TableCell>{site.externalId}</TableCell>
      <TableCell>{site.totalDevices}</TableCell>
      <TableCell>{site.siteType}</TableCell>
      <TableCell>{site.parentWarehouseName}</TableCell>
    </TableRow>
  )
}

export default SiteTableRow
