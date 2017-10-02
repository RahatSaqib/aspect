import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const PersonTableRow = ({ intl, person, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {person.get('name')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {person.get('level')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {person.get('state')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {person.get('lga')}
    </TableCell>
  </TableRow>
)

export default enhance(PersonTableRow)
