import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

import AspectCheckbox from '../../components/shared/AspectCheckbox'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ReporterTableRow = ({ intl, reporter, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{reporter.get('user')}</TableCell>
    <TableCell>{reporter.get('deviceName')}</TableCell>
    <TableCell>{intl.formatRelative(reporter.get('createdOn'))}</TableCell>
    <TableCell>{intl.formatRelative(reporter.get('lastSeen'))}</TableCell>
    <TableCell>
      {intl.formatNumber(reporter.get('deliveredLastMonth'))}
    </TableCell>
    <TableCell>
      {intl.formatNumber(reporter.get('deliveredThisMonth'))}
    </TableCell>
    <TableCell>
      {intl.formatNumber(reporter.get('acknowledgedRatio'), {
        style: 'percent',
      })}
    </TableCell>
    <TableCell>{intl.formatNumber(reporter.get('totalFlagged'))}</TableCell>
    <TableCell>
      <AspectCheckbox
        name="selected"
        className={cssClasses('Checkbox__field')}
        inputProps={{
          'data-device-api-key-id': reporter.get('id'),
        }}
        // disabled={disabled}
        checked={!reporter.get('status')}
        // onChange={onSelectedChange}
      />
    </TableCell>
  </TableRow>
)

export default enhance(ReporterTableRow)
