import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ReporterTableRow = ({ intl, reporter, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{reporter.get('siteName')}</TableCell>
    <TableCell>{reporter.get('shortName')}</TableCell>
    <TableCell>{reporter.get('status')}</TableCell>
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
  </TableRow>
)

export default enhance(ReporterTableRow)
