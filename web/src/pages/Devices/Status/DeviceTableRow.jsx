import React from 'react'
import { Tooltip } from '@mui/material'
import { useIntl } from 'react-intl'
import ColoredNumber from '../../../components/shared/ColoredNumber'
import StatusIcon from '../../../components/shared/StatusIcon'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../components/shared/tableBody'
import { formatRelative } from '../../../utils/utils/dateFormat'
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

const DeviceTableRow = ({ device, displayPreferences: { errorRateThreshold }, ...restProps }) => {
  const { formatMessage, formatNumber, formatRelativeTime } = useIntl()
  return (
    <TableRow {...restProps} className={`TableRow ${restProps.className}`}>
      <TableCell>{device.name}</TableCell>
      <TableCell hiddenOn="lg">{device.siteName}</TableCell>
      <TableCell>
        {device.approvalStatusI18nKey
          ? formatMessage(messages[device.approvalStatusI18nKey])
          : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell>
        <StatusIcon
          title={formatMessage(messages[device.deviceStatus])}
          status={
            device.deviceStatus === 'up'
              ? 'success'
              : device.deviceStatus === 'down'
              ? 'error'
              : device.deviceStatus === 'unknown'
              ? 'warning'
              : 'notRecorded'
          }
        />
      </TableCell>
      <TableCell>
        {device.maintenanceStatusI18nKey
          ? formatMessage(messages[device.maintenanceStatusI18nKey])
          : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell>
        {device.lastResultConductedOn ? formatRelative(device.lastResultConductedOn, formatRelativeTime) : null}
      </TableCell>
      <TableCell>
        <StatusIcon
          title={formatMessage(messages[device.connectorStatus])}
          status={device.connectorStatus === 'online' ? 'success' : 'error'}
        />
      </TableCell>
      <TableCell>{device.lastPingInUtc ? formatRelative(device.lastPingInUtc, formatRelativeTime) : null}</TableCell>
      <TableCell hiddenOn="lg">
        {device.connectorVersion ? device.connectorVersion : formatMessage(messages.notAvailable)}
      </TableCell>
      <TableCell hiddenOn="lg">
        <Rate it={device.availability} messageId={messages.availabilityOfDays} />
      </TableCell>
      <TableCell hiddenOn="lg">
        <Rate it={device.error} threshold={errorRateThreshold} messageId={messages.errorOfTotal} />
      </TableCell>
      <TableCell hiddenOn="lg">
        {device.createdOnInUtc ? formatRelative(device.createdOnInUtc, formatRelativeTime) : null}
      </TableCell>
      <TableCell hiddenOn="lg" numeric>
        {formatNumber(device.resultCountLastMonth)}
      </TableCell>
      <TableCell hiddenOn="lg" numeric>
        {formatNumber(device.resultCountThisMonth)}
      </TableCell>
    </TableRow>
  )
}
export default DeviceTableRow
