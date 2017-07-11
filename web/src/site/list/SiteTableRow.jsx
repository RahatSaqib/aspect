import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const SiteTableRow = ({ intl, site, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {site.get('name')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {site.get('state')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {site.get('status')}
    </TableCell>
  </TableRow>

export default enhance(SiteTableRow)
