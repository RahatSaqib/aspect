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

const CaseTableRow = ({ intl, _case, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{_case.get('externalId')}</TableCell>
    <TableCell>{_case.get('attendingClinic')}</TableCell>
    <TableCell>{_case.get('patientId')}</TableCell>
    <TableCell>{_case.get('status')}</TableCell>
  </TableRow>
)

export default CaseTableRow
