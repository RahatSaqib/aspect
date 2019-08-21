import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDate } from '../../shared/utils/dateFormat'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

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
}) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>
      <AspectCheckbox
        name="selected"
        className={cssClasses('Checkbox__field')}
        inputProps={{
          'data-device-api-key-id': deviceApiKey.get('id'),
        }}
        disabled={disabled}
        checked={checked}
        onChange={onSelectedChange}
      />
    </TableCell>
    <TableCell>{formatDate(deviceApiKey.get('createdOn'))}</TableCell>
    <TableCell>{deviceApiKey.get('token')}</TableCell>
    <TableCell>{deviceApiKey.get('partner')}</TableCell>
    <TableCell>{deviceApiKey.get('country')}</TableCell>
    <TableCell>{deviceApiKey.get('site')}</TableCell>
    <TableCell>{deviceApiKey.get('device')}</TableCell>
    <TableCell>
      <AspectCheckbox
        name="revoked"
        inputProps={{
          'data-device-api-key-id': deviceApiKey.get('id'),
        }}
        checked={deviceApiKey.get('revoked') > 0}
        onChange={onRevokedChange}
      />
    </TableCell>
  </TableRow>
)

export default enhance(DeviceApiKeyTableRow)
