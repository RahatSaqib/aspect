import React from 'react'
import { Tooltip } from '@mui/material'
import { useIntl } from 'react-intl'
import ColoredNumber from '../../../oldComponents/shared/ColoredNumber'
import stylesShared from '../../../oldComponents/shared/DataTableRow.module.css'
import StatusIcon from '../../../oldComponents/shared/StatusIcon'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import ColoredButton from '../../../oldComponents/themedReactToolbox/ColoredButton'
import { formatRelative } from '../../../utils/utils/dateFormat'
import styles from './DeviceTableRow.module.css'
import messages from './messages'

const Rate = ({ it, messageId, threshold }) => {
  const { formatMessage } = useIntl()

  return (
    <span>
      {it.total === 0 ? (
        formatMessage(messages.notAvailable)
      ) : (
        <Tooltip title={formatMessage(messageId, it)}>
          <span style={{ display: 'inline-block' }}>
            <ColoredNumber number={it.rate} formatNumberStyle="percent" error={threshold && it.rate > threshold} />
          </span>
        </Tooltip>
      )}
    </span>
  )
}

const DeviceTableRow = ({ device, onAlertClick, displayPreferences: { errorRateThreshold }, ...restProps }) => {
  const { formatMessage, formatNumber, formatRelativeTime } = useIntl()
  return (
    <TableRow {...restProps} className={`TableRow ${restProps.className}`}>
      <TableCell>{device.get('name')}</TableCell>
      <TableCell hiddenOn="lg">{device.get('siteName')}</TableCell>
      <TableCell>
        {device.get('approvalStatusI18nKey')
          ? formatMessage(messages[device.get('approvalStatusI18nKey')])
          : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell>
        <StatusIcon
          title={formatMessage(messages[device.get('deviceStatus')])}
          status={
            device.get('deviceStatus') === 'up'
              ? 'success'
              : device.get('deviceStatus') === 'down'
              ? 'error'
              : device.get('deviceStatus') === 'unknown'
              ? 'warning'
              : 'notRecorded'
          }
        />
      </TableCell>
      <TableCell>
        {device.get('maintenanceStatusI18nKey')
          ? formatMessage(messages[device.get('maintenanceStatusI18nKey')])
          : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell>
        {device.get('lastResultConductedOn')
          ? formatRelative(device.get('lastResultConductedOn'), formatRelativeTime)
          : null}
      </TableCell>
      <TableCell>
        <StatusIcon
          title={formatMessage(messages[device.get('connectorStatus')])}
          status={device.get('connectorStatus') === 'online' ? 'success' : 'error'}
        />
      </TableCell>
      <TableCell>
        {device.get('lastPingInUtc') ? formatRelative(device.get('lastPingInUtc'), formatRelativeTime) : null}
      </TableCell>
      <TableCell hiddenOn="lg">
        {device.get('connectorVersion') ? device.get('connectorVersion') : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell className={styles.TableCell__alerts}>
        {device.get('issueCategories').map(it => (
          <ColoredButton
            key={it.get('key')}
            className={stylesShared.ColoredButton__micro}
            shipCove={it.get('key') === 'issueCategoryDeviceHealth'}
            shakespeare={it.get('key') === 'issueCategoryReagentHealth'}
            mountain={it.get('key') === 'issueCategoryDataHealth'}
            brink={it.get('key') === 'issueCategoryConnectivityHealth'}
            label={formatMessage(messages[it.get('key')])}
            onClick={onAlertClick}
            data-device-id={device.get('id')}
          />
        ))}
      </TableCell>
      <TableCell hiddenOn="lg">
        <Rate it={device.get('availability').toJS()} messageId={messages.availabilityOfDays} />
      </TableCell>
      <TableCell hiddenOn="lg">
        <Rate it={device.get('error').toJS()} threshold={errorRateThreshold} messageId={messages.errorOfTotal} />
      </TableCell>
      <TableCell hiddenOn="lg">
        {device.get('createdOnInUtc') ? formatRelative(device.get('createdOnInUtc'), formatRelativeTime) : null}
      </TableCell>
      <TableCell hiddenOn="lg" numeric>
        {formatNumber(device.get('resultCountLastMonth'))}
      </TableCell>
      <TableCell hiddenOn="lg" numeric>
        {formatNumber(device.get('resultCountThisMonth'))}
      </TableCell>
    </TableRow>
  )
}
export default DeviceTableRow
