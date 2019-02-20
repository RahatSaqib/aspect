import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const formatterByType = _.partial(
  // TODO: refactor, see DeviceOperationTableRow
  (formatterBy, type) => formatterBy[type] || formatterBy.default,
  {
    number: (n, intl) => (_.isNumber(n) ? intl.formatNumber(n) : false),
    default: _.identity,
  }
)

const ResultTableRow = ({ intl, extraColumns, result, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(result.get('endedOn'))}</TableCell>
    <TableCell hiddenOn="sm">{result.get('deviceName')}</TableCell>
    <TableCell hiddenOn="sm">{result.get('sampleOriginSiteName')}</TableCell>
    <TableCell>{result.get('sampleId')}</TableCell>
    <TableCell hiddenOn="md">{result.get('sampleGroup')}</TableCell>
    <TableCell>{result.get('resultText')}</TableCell>
    <TableCell hiddenOn="sm">{result.get('resultWorkflowStatus')}</TableCell>
    <TableCell hiddenOn="xs">{result.get('patientId')}</TableCell>
    {extraColumns.map(column => (
      // TODO: refactor, see DeviceOperationTableRow
      <TableCell key={column.get('db')} hiddenOn="nd">
        {formatterByType(column.get('type'))(
          result.get(column.get('db')),
          intl
        )}
      </TableCell>
    ))}
  </TableRow>
)

export default ResultTableRow
