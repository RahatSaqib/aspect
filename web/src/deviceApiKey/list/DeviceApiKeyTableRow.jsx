import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Checkbox } from 'react-toolbox/lib/checkbox'
import { formatDate } from '../../shared/utils/dateFormat'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(require('./DeviceApiKeyTableRow.css'))

const enhance = _.identity

const themes = {
  Checkbox: { field: cssClasses('Checkbox__field') },
}

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
      <Checkbox
        name="selected"
        data-device-api-key-id={deviceApiKey.get('id')}
        disabled={disabled}
        checked={checked}
        onChange={onSelectedChange}
        theme={themes.Checkbox}
      />
    </TableCell>
    <TableCell>{formatDate(deviceApiKey.get('createdOn'))}</TableCell>
    <TableCell>{deviceApiKey.get('token')}</TableCell>
    <TableCell>{deviceApiKey.get('partner')}</TableCell>
    <TableCell>{deviceApiKey.get('country')}</TableCell>
    <TableCell>{deviceApiKey.get('site')}</TableCell>
    <TableCell>{deviceApiKey.get('device')}</TableCell>
    <TableCell>
      <Checkbox
        name="revoked"
        data-device-api-key-id={deviceApiKey.get('id')}
        checked={deviceApiKey.get('revoked') > 0}
        onChange={onRevokedChange}
      />
    </TableCell>
  </TableRow>
)

export default enhance(DeviceApiKeyTableRow)
