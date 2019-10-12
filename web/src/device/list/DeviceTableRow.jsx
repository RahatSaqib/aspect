import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDistanceStrict, parseISO } from 'date-fns'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import ColoredNumber from '../../components/shared/ColoredNumber'
import messages from './messages'

const cssClasses = classnames.bind(require('./DeviceTableRow.css'))
const sharedCssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const Rate = ({ intl, it, messageId, threshold }) => (
  <span>
    {it.total === 0 ? (
      intl.formatMessage(messages.noResults)
    ) : (
      <ColoredNumber
        number={it.rate}
        intl={intl}
        formatNumberStyle="percent"
        error={threshold && it.rate > threshold}
      />
    )}
    <span className={cssClasses('Rate__hover')}>
      {intl.formatMessage(messageId, it)}
    </span>
  </span>
)

const DeviceTableRow = ({
  intl,
  device,
  onAlertClick,
  displayPreferences,
  ...restProps
}) => (
  <TableRow
    {...restProps}
    className={cssClasses('TableRow', restProps.className)}
  >
    <TableCell>{device.get('name')}</TableCell>
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
        threshold={displayPreferences.get('errorRateThreshold')}
        messageId={messages.errorOfTotal}
      />
    </TableCell>
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
    <TableCell>
      {intl.formatMessage(messages.reportingForDays, {
        period: formatDistanceStrict(
          new Date(),
          parseISO(device.get('createdOn'))
        ),
      })}
    </TableCell>
    <TableCell>{intl.formatRelative(device.get('lastSeen'))}</TableCell>
    <TableCell numeric>
      {intl.formatNumber(device.get('resultCountLastMonth'))}
    </TableCell>
    <TableCell numeric>
      {intl.formatNumber(device.get('resultCountThisMonth'))}
    </TableCell>
  </TableRow>
)

export default enhance(DeviceTableRow)
