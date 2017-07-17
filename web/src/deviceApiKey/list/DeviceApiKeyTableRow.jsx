import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import Checkbox from 'material-ui/Checkbox'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const DeviceApiKeyTableRow = ({
  intl,
  deviceApiKey,
  disabled,
  checked,
  onCheck,
  onRevoke,
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
        onCheck={onCheck}
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
        onCheck={onRevoke}
      />
    </TableCell>
  </TableRow>

export default enhance(DeviceApiKeyTableRow)
