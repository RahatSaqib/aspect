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
<<<<<<< HEAD
    <TableCell>{_case.get('diseaseName')}</TableCell>
    <TableCell>{_case.get('status')}</TableCell>
=======
    <TableCell>{_case.get('outcome')}</TableCell>
>>>>>>> d91e0de6b... CaseList rebased
  </TableRow>
)

export default CaseTableRow
