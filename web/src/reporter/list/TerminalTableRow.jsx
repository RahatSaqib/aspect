import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const TerminalTableRow = ({ intl, terminal, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {terminal.get('siteName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {terminal.get('shortname')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {terminal.get('status')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(terminal.get('createdOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(terminal.get('lastSeen'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(terminal.get('deliveredLastMonth'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(terminal.get('deliveredThisMonth'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(terminal.get('acknowledgedRatio'), {
        style: 'percent',
      })}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatNumber(terminal.get('totalFlagged'))}
    </TableCell>
  </TableRow>

export default enhance(TerminalTableRow)
