import React from 'react'
import classnames from 'classnames/bind'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import { formatRelative } from '../../../utils/utils/dateFormat'

const cssClasses = classnames.bind(styles)

const SiteTableRow = ({ site, onAlertClick, ...restProps }) => {
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{site.name}</TableCell>
      <TableCell>{site.state}</TableCell>
      <TableCell>{site.lga}</TableCell>
      <TableCell>{site.externalId}</TableCell>
      <TableCell>{site.totalDevices}</TableCell>
      <TableCell>{formatRelative(site.inventoryUpdatedOn, 'N/A')}</TableCell>
    </TableRow>
  )
}

export default SiteTableRow
