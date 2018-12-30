import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDistanceStrict } from 'date-fns'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import messages from './messages'

const cssClasses = classnames.bind(require('./DeviceTableRow.css'))

const enhance = _.identity

const Rate = ({ intl, it, messageId }) => (
  <span>
    {it.total === 0
      ? intl.formatMessage(messages.noTests)
      : intl.formatNumber(it.count / it.total, { style: 'percent' })}
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
    <TableCell>{device.get('name')}</TableCell>
    <TableCell>{device.get('state')}</TableCell>
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
        messageId={messages.errorOfTotal}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell--alerts')}>
      {device
        .get('alerts')
        .map(it => (
          <ColoredButton
            key={it.get('type')}
            className={cssClasses('ColoredButton--micro')}
            shipCove={it.get('type') === 'needs-repair'}
            shakespeare={it.get('type') === 'warranty'}
            mountain={it.get('type') === 'quality-control'}
            brink={it.get('type') === 'connectivity'}
            label={intl.formatMessage(messages[_.camelCase(it.get('type'))])}
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
