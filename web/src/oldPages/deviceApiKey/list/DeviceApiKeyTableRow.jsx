import React from 'react'
import AspectCheckbox from '../../../oldComponents/shared/AspectCheckbox'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import { formatDate } from '../../../utils/utils/dateFormat'
import styles from './DeviceApiKeyTableRow.module.css'

const DeviceApiKeyTableRow = ({ deviceApiKey, disabled, checked, onSelectedChange, onRevokedChange, ...restProps }) => (
  <TableRow {...restProps} className={styles[restProps.className]}>
    <TableCell>
      <AspectCheckbox
        name="selected"
        className={styles.Checkbox__field}
        inputProps={{
          'data-device-api-key-id': deviceApiKey.id,
        }}
        disabled={disabled}
        checked={checked}
        onChange={onSelectedChange}
      />
    </TableCell>
    <TableCell>{formatDate(deviceApiKey.createdOn)}</TableCell>
    <TableCell>{deviceApiKey.token}</TableCell>
    <TableCell>{deviceApiKey.partner}</TableCell>
    <TableCell>{deviceApiKey.country}</TableCell>
    <TableCell>{deviceApiKey.site}</TableCell>
    <TableCell>{deviceApiKey.device}</TableCell>
    <TableCell>
      <AspectCheckbox
        name="revoked"
        inputProps={{
          'data-device-api-key-id': deviceApiKey.id,
        }}
        checked={deviceApiKey.revoked > 0}
        onChange={onRevokedChange}
      />
    </TableCell>
  </TableRow>
)

export default DeviceApiKeyTableRow
