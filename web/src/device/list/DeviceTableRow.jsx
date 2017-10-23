import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const DeviceTableRow = ({ intl, device, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {device.get('name')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {device.get('state')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {device.get('status')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(device.get('createdOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(device.get('lastSeen'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--numeric')}>
      {intl.formatNumber(device.get('lastMonth'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--numeric')}>
      {intl.formatNumber(device.get('thisMonth'))}
    </TableCell>
  </TableRow>
)

export default enhance(DeviceTableRow)
