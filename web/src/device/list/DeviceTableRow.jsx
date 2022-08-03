import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { injectIntl } from 'react-intl'

import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import ColoredNumber from '../../components/shared/ColoredNumber'
import messages from './messages'
import { formatRelative } from '../../shared/utils/dateFormat'

import styles from './DeviceTableRow.css'
import stylesShared from '../../components/shared/DataTableRow.css'
import StatusIcon from '../../components/shared/StatusIcon'

const cssClasses = classnames.bind(styles)
const sharedCssClasses = classnames.bind(stylesShared)

const enhance = identity(injectIntl)

const Rate = ({ intl, it, messageId, threshold }) => (
  <span>
    {it.total === 0 ? (
      intl.formatMessage(messages.notAvailable)
    ) : (
      <ColoredNumber number={it.rate} formatNumberStyle="percent" error={threshold && it.rate > threshold} />
    )}
    <br />
    <span className={cssClasses('Rate__hover')}>{intl.formatMessage(messageId, it)}</span>
  </span>
)

const DeviceTableRow = ({ intl, device, onAlertClick, displayPreferences: { errorRateThreshold }, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses('TableRow', restProps.className)}>
    <TableCell>{device.get('name')}</TableCell>
    <TableCell hiddenOn="lg">{device.get('siteName')}</TableCell>
    <TableCell>
      {device.get('approvalStatusI18nKey') ? intl.formatMessage(messages[device.get('approvalStatusI18nKey')]) : 'N/A'}
    </TableCell>
    <TableCell>
      <StatusIcon
        title={intl.formatMessage(messages[device.get('deviceStatus')])}
        status={
          device.get('deviceStatus') === 'up' ? 'success' : device.get('deviceStatus') === 'down' ? 'error' : 'warning'
        }
      />
    </TableCell>
    <TableCell>
      {device.get('maintenanceStatusI18nKey')
        ? intl.formatMessage(messages[device.get('maintenanceStatusI18nKey')])
        : 'N/A'}
    </TableCell>
    <TableCell>{formatRelative(device.get('lastResultConductedOn'))}</TableCell>
    <TableCell>
      <StatusIcon
        title={intl.formatMessage(messages[device.get('connectorStatus')])}
        status={device.get('connectorStatus') === 'online' ? 'success' : 'error'}
      />
    </TableCell>
    <TableCell>{formatRelative(device.get('lastPingOn'))}</TableCell>
    <TableCell hiddenOn="lg">{device.get('connectorVersion')}</TableCell>
    <TableCell className={cssClasses('TableCell--alerts')}>
      {device.get('issueCategories').map(it => (
        <ColoredButton
          key={it.get('key')}
          className={sharedCssClasses('ColoredButton--micro')}
          shipCove={it.get('key') === 'issueCategoryDeviceHealth'}
          shakespeare={it.get('key') === 'issueCategoryReagentHealth'}
          mountain={it.get('key') === 'issueCategoryDataHealth'}
          brink={it.get('key') === 'issueCategoryConnectivityHealth'}
          label={intl.formatMessage(messages[it.get('key')])}
          onClick={onAlertClick}
          data-device-id={device.get('id')}
        />
      ))}
    </TableCell>
    <TableCell hiddenOn="lg">
      <Rate intl={intl} it={device.get('availability').toJS()} messageId={messages.availabilityOfDays} />
    </TableCell>
    <TableCell hiddenOn="lg">
      <Rate
        intl={intl}
        it={device.get('error').toJS()}
        threshold={errorRateThreshold}
        messageId={messages.errorOfTotal}
      />
    </TableCell>
    <TableCell hiddenOn="lg">{formatRelative(device.get('createdOn'))}</TableCell>
    <TableCell hiddenOn="lg" numeric>
      {intl.formatNumber(device.get('resultCountLastMonth'))}
    </TableCell>
    <TableCell hiddenOn="lg" numeric>
      {intl.formatNumber(device.get('resultCountThisMonth'))}
    </TableCell>
  </TableRow>
)

export default enhance(DeviceTableRow)
