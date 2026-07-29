import React, { useEffect, useState } from 'react'
import { FaCheck, FaExternalLinkAlt as FaExternalLink, FaRegCopy } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import AspectCheckbox from '../../../components/shared/AspectCheckbox'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../components/shared/tableBody'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import { formatDate } from '../../../utils/utils/dateFormat'
import styles from './DeviceApiKeyTableRow.module.css'

const getSiteDevicePairs = deviceApiKey => {
  if (deviceApiKey.devices && deviceApiKey.devices.length > 0) {
    return deviceApiKey.devices.map(device => ({
      key: `${device.siteId || 'site'}-${device.id || 'device'}`,
      siteId: device.siteId,
      siteName: device.siteName,
      deviceId: device.id,
      deviceName: device.name,
    }))
  }

  if (deviceApiKey.sites && deviceApiKey.sites.length > 0) {
    return deviceApiKey.sites.map(site => ({
      key: `${site.id || 'site'}-no-device`,
      siteId: site.id,
      siteName: site.name,
      deviceId: null,
      deviceName: '',
    }))
  }

  return [
    {
      key: `${deviceApiKey.id}-fallback`,
      siteId: deviceApiKey.siteId,
      siteName: deviceApiKey.site,
      deviceId: null,
      deviceName: deviceApiKey.device,
    },
  ]
}

const DeviceApiKeyTableRow = ({ deviceApiKey, onRevokedChange, ...restProps }) => {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const siteDevicePairs = getSiteDevicePairs(deviceApiKey).filter(pair => pair.siteName || pair.deviceName)

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
      <TableCell>
        {siteDevicePairs.length > 0 ? (
          <div className={styles.PairList}>
            {siteDevicePairs.map(pair => (
              <div key={pair.key} className={styles.PairRow}>
                {pair.siteName ? (
                  <>
                    <span className={styles.PairText}>{pair.siteName}</span>
                    {pair.siteId ? (
                      <FaExternalLink
                        onClick={() => gotoWithReturnUrl(`/browse/site/${pair.siteId}`, navigate, location)}
                        className={styles.PairLinkIcon}
                      />
                    ) : null}
                  </>
                ) : null}
                {pair.siteName && pair.deviceName ? <span className={styles.PairSeparator}> / </span> : null}
                {pair.deviceName ? (
                  <>
                    <span className={styles.PairText}>{pair.deviceName}</span>
                    {pair.deviceId ? (
                      <FaExternalLink
                        onClick={() => gotoWithReturnUrl(`/browse/device/list/${pair.deviceId}`, navigate, location)}
                        className={styles.PairLinkIcon}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span className={styles.PairEmpty}>—</span>
        )}
      </TableCell>
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
