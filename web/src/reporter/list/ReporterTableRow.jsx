import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ReporterTableRow = ({ intl, reporter, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {reporter.get('siteName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {reporter.get('shortName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {reporter.get('status')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(reporter.get('createdOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(reporter.get('lastSeen'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(reporter.get('deliveredLastMonth'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(reporter.get('deliveredThisMonth'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(reporter.get('acknowledgedRatio'), {
        style: 'percent',
      })}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(reporter.get('totalFlagged'))}
    </TableCell>
  </TableRow>
)

export default enhance(ReporterTableRow)
