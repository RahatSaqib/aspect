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

const RouterTableRow = ({ intl, router, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{router.get('name')}</TableCell>
    <TableCell>{router.get('status')}</TableCell>
    <TableCell>{intl.formatRelative(router.get('createdOn'))}</TableCell>
    <TableCell>{intl.formatRelative(router.get('lastSeen'))}</TableCell>
  </TableRow>
)

export default enhance(RouterTableRow)
