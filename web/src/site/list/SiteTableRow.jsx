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

const SiteTableRow = ({ intl, site, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{site.get('name')}</TableCell>
    <TableCell>{site.get('state')}</TableCell>
    <TableCell>{site.get('lga')}</TableCell>
    <TableCell>{site.get('totalDevices')}</TableCell>
  </TableRow>
)

export default enhance(SiteTableRow)
