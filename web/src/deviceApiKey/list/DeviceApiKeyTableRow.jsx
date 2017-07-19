import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import { Checkbox } from 'react-toolbox/lib/checkbox'

const cssClasses = classnames.bind(require('./DeviceApiKeyTableRow.css'))

const enhance = _.identity

const DeviceApiKeyTableRow = ({
  intl,
  deviceApiKey,
  disabled,
  checked,
  onSelectedChange,
  onRevokedChange,
  ...restProps
}) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      <Checkbox
        name="selected"
        data-device-Api-Key-Id={deviceApiKey.get('id')}
        disabled={disabled}
        checked={checked}
        onChange={onSelectedChange}
        theme={{ field: cssClasses('Checkbox__field') }}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatDate(deviceApiKey.get('createdOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {deviceApiKey.get('token')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {deviceApiKey.get('partner')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {deviceApiKey.get('country')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {deviceApiKey.get('site')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {deviceApiKey.get('device')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <Checkbox
        name="revoked"
        data-device-Api-Key-Id={deviceApiKey.get('id')}
        checked={deviceApiKey.get('revoked') > 0}
        onChange={onRevokedChange}
      />
    </TableCell>
  </TableRow>

export default enhance(DeviceApiKeyTableRow)
