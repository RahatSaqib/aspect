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

const PersonTableRow = ({ intl, person, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{person.get('name')}</TableCell>
    <TableCell>{person.get('level')}</TableCell>
    <TableCell>{person.get('state')}</TableCell>
    <TableCell>{person.get('lga')}</TableCell>
  </TableRow>
)

export default enhance(PersonTableRow)
