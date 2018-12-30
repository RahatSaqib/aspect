import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDate } from '../../../shared/utils/dateFormat'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ResultTableRow = ({ intl, result, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(result.get('endedOn'))}</TableCell>
    <TableCell>{result.get('sampleOriginSiteName')}</TableCell>
    <TableCell>{result.get('sampleId')}</TableCell>
    <TableCell>{result.get('sampleGroup')}</TableCell>
    <TableCell>{result.get('resultText')}</TableCell>
    <TableCell>{result.get('resultWorkflowStatus')}</TableCell>
    <TableCell>{result.get('patientId')}</TableCell>
  </TableRow>
)

export default enhance(ResultTableRow)
