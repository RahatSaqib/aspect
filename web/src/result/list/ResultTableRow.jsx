import partial from 'lodash/partial'
import isNumber from 'lodash/isNumber'
import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import PermIdentity from '@material-ui/icons/PermIdentity'
import Tooltip from '@material-ui/core/Tooltip'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const styles = require('../../components/shared/DataTableRow.css')

const formatterByType = partial(
  // TODO: refactor, see DeviceOperationTableRow
  (formatterBy, type) => formatterBy[type] || formatterBy.default,
  {
    number: (n, intl) => (isNumber(n) ? intl.formatNumber(n) : false),
    default: identity,
  }
)

const ResultTableRow = ({ intl, extraColumns, result, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>
      {result.get('endedOn') ? formatDate(result.get('endedOn')) : ''}
    </TableCell>
    <TableCell hiddenOn="xs">{result.get('deviceName')}</TableCell>
    <TableCell hiddenOn="sm">{result.get('sampleOriginSiteName')}</TableCell>
    <TableCell>{result.get('sampleId')}</TableCell>
    <TableCell>{result.get('assayName')}</TableCell>
    <TableCell>{result.get('resultText')}</TableCell>
    <TableCell hiddenOn="lg">{result.get('errorCode')}</TableCell>
    <TableCell hiddenOn="md">{result.get('resultWorkflowStatus')}</TableCell>
    <TableCell hiddenOn="md">
      {result.get('treatmentStatusInfo') && (
        <Tooltip title={result.get('resultTreatmentStatusName')}>
          <PermIdentity
            className={styles[`${result.get('treatmentStatusInfo')}`]}
          />
        </Tooltip>
      )}
    </TableCell>
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
