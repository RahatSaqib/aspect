import partial from 'lodash/partial'
import isNumber from 'lodash/isNumber'
import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import PermIdentity from '@material-ui/icons/PermIdentity'
import Tooltip from '@material-ui/core/Tooltip'

import { useIntl } from 'react-intl'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'
import formatI18nMessage from '../../shared/i18n/formatterWeb'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const styles = require('../../components/shared/DataTableRow.css')

const ResultTableRow = ({ extraColumns, result, messages, ...restProps }) => {
  const { formatMessage, formatNumber } = useIntl()
  const formatterByType = partial(
    // TODO: refactor, see DeviceOperationTableRow
    (formatterBy, type) => formatterBy[type] || formatterBy.default,
    {
      number: n => (isNumber(n) ? formatNumber(n) : false),
      default: identity,
    }
  )
  const formatI18n = (key, defaultMessage) =>
    messages[result.get(key)]
      ? formatMessage(messages[result.get(key)])
      : result.get(defaultMessage)
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>
        {result.get('endedOn') ? formatDate(result.get('endedOn')) : ''}
      </TableCell>
      <TableCell hiddenOn="xs">{result.get('deviceName')}</TableCell>
      <TableCell hiddenOn="sm">{result.get('sampleOriginSiteName')}</TableCell>
      <TableCell>{result.get('sampleId')}</TableCell>
      <TableCell>{formatI18n('assayI18nKey', 'assayName')}</TableCell>
      <TableCell>{result.get('resultText')}</TableCell>
      <TableCell hiddenOn="lg">{result.get('errorCode')}</TableCell>
      <TableCell hiddenOn="md">
        {formatI18nMessage(
          messages,
          formatMessage,
          result.get('resultWorkflowStatusI18nkey'),
          result.get('resultWorkflowStatus')
        )}
      </TableCell>
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
          {formatterByType(column.get('type'))(result.get(column.get('db')))}
        </TableCell>
      ))}
    </TableRow>
  )
}
export default ResultTableRow
