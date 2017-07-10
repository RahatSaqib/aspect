import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const RouterTableRow = ({ intl, router, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {router.get('name')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {router.get('status')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(router.get('createdOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(router.get('lastSeen'))}
    </TableCell>
  </TableRow>

export default enhance(RouterTableRow)
