import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDistanceStrict } from 'date-fns'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import ColoredNumber from '../../components/shared/ColoredNumber'
import { getAspectDisplayPreferences } from '../../globals/sideEffects/LocalStorage'
import messages from './messages'

const cssClasses = classnames.bind(require('./DeviceTableRow.css'))
const sharedCssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const prefs = getAspectDisplayPreferences()
const enhance = _.identity

const Rate = ({ intl, it, messageId, threshold }) => (
  <span>
    {it.total === 0 ? (
      intl.formatMessage(messages.noTests)
    ) : (
      <ColoredNumber
        number={it.count / it.total}
        intl={intl}
        formatNumberStyle="percent"
        error={
          threshold && it.count / it.total > prefs.get('errorRateThreshold')
        }
      />
    )}
    <span className={cssClasses('Rate__hover')}>
      {intl.formatMessage(messageId, it)}
    </span>
  </span>
)

const DeviceTableRow = ({ intl, device, onAlertClick, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses('TableRow', restProps.className)}
  >
    <TableCell>{`${device.get('type')} at ${device.get(
      'siteName'
    )}`}</TableCell>
    <TableCell>{device.get('status')}</TableCell>
    <TableCell>
      <Rate
        intl={intl}
        it={device.get('availability').toJS()}
        messageId={messages.availabilityOfDays}
      />
    </TableCell>
    <TableCell>
      <Rate
        intl={intl}
        it={device.get('error').toJS()}
        threshold={prefs.get('errorRateThreshold')}
        messageId={messages.errorOfTotal}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell--alerts')}>
      {device
        .get('alerts')
        .map(it => (
          <ColoredButton
            key={it.get('key')}
            className={sharedCssClasses('ColoredButton--micro')}
            shipCove={it.get('key') === 'issueCategoryDeviceHealth'}
            shakespeare={it.get('key') === 'issueCategoryReagentHealth'}
            mountain={it.get('key') === 'issueCategoryDataHealth'}
            brink={it.get('key') === 'issueCategoryConnectivityHealth'}
            label={intl.formatMessage(messages[it.get('key')])}
            onClick={onAlertClick}
            data-pathname="/browse/notification/detail"
          />
        ))}
    </TableCell>
    <TableCell>
      {intl.formatMessage(messages.reportingForDays, {
        period: formatDistanceStrict(new Date(), device.get('createdOn')),
      })}
    </TableCell>
    <TableCell>{intl.formatRelative(device.get('lastSeen'))}</TableCell>
    <TableCell numeric>{intl.formatNumber(device.get('lastMonth'))}</TableCell>
    <TableCell numeric>{intl.formatNumber(device.get('thisMonth'))}</TableCell>
  </TableRow>
)

export default enhance(DeviceTableRow)
