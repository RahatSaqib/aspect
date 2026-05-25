import React, { useEffect, useState } from 'react'
import { FaCheck, FaRegCopy } from 'react-icons/fa'
import AspectCheckbox from '../../../components/shared/AspectCheckbox'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../components/shared/tableBody'
import { formatDate } from '../../../utils/utils/dateFormat'
import styles from './DeviceApiKeyTableRow.module.css'

const DeviceApiKeyTableRow = ({ deviceApiKey, onRevokedChange, ...restProps }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = value => {
    navigator.clipboard.writeText(value)
    setCopied(true)
  }

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  return (
    <TableRow {...restProps} className={styles[restProps.className]}>
      <TableCell>{formatDate(deviceApiKey.createdOn)}</TableCell>
      <TableCell>
        {deviceApiKey.token}{' '}
        {!copied ? (
          <FaRegCopy className={styles.CopyIcon} onClick={() => copyToClipboard(deviceApiKey.token)} />
        ) : (
          <FaCheck />
        )}
      </TableCell>
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
}
export default DeviceApiKeyTableRow
