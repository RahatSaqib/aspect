import classnames from 'classnames/bind'
import React from 'react'
import { formatDate } from '../../shared/utils/dateFormat'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const CaseTableRow = ({ intl, _case, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(_case.get('createdOn'))}</TableCell>
    <TableCell>{_case.get('externalId')}</TableCell>
    <TableCell>{_case.get('sampleOriginSite')}</TableCell>
    <TableCell>{_case.get('patientId')}</TableCell>
    <TableCell>{_case.get('diseaseName')}</TableCell>
    <TableCell>{_case.get('status')}</TableCell>
  </TableRow>
)

export default CaseTableRow
