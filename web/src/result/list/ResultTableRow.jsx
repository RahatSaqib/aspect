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
import useI18n from '../../Hooks/i18n/useI18n'

import styles from '../../components/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const ResultTableRow = ({ extraColumns, result, messages, ...restProps }) => {
  const { formatMessage, formatNumber } = useI18n()
  const formatterByType = partial(
    // TODO: refactor, see DeviceOperationTableRow
    (formatterBy, type) => formatterBy[type] || formatterBy.default,
    {
      number: n => (isNumber(n) ? formatNumber(n) : false),
      default: identity,
    }
  )
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>
        {result.get('endedOn') ? formatDate(result.get('endedOn')) : ''}
      </TableCell>
      <TableCell hiddenOn="xs">{result.get('deviceName')}</TableCell>
      <TableCell hiddenOn="sm">{result.get('sampleOriginSiteName')}</TableCell>
      <TableCell>{result.get('sampleId')}</TableCell>
      <TableCell>
        {formatMessage(
          messages[result.get('assayI18nKey')],
          result.get('assayName')
        )}
      </TableCell>
      <TableCell>{result.get('resultText')}</TableCell>
      <TableCell hiddenOn="lg">{result.get('errorCode')}</TableCell>
      <TableCell hiddenOn="md">
        {formatMessage(
          messages[result.get('resultWorkflowStatusI18nkey')],
          result.get('resultWorkflowStatus')
        )}
      </TableCell>
      <TableCell hiddenOn="md">
        {result.get('treatmentStatusInfo') && (
          <Tooltip
            title={result.get('resultTreatmentStatusName') || ''}
            disableInteractive
          >
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
