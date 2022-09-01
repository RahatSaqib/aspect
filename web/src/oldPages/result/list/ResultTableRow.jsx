import partial from 'lodash/partial'
import isNumber from 'lodash/isNumber'
import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import PermIdentity from '@mui/icons-material/PermIdentity'
import Tooltip from '@mui/material/Tooltip'
import PermissionsProvider from '../../../providers/PermissionsProvider'

import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import useI18n from '../../../hooks/useI18n'
import formatters from '../formatters'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'

import styles from '../../../oldComponents/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const ResultTableRow = ({ extraColumns, result, messages, ...restProps }) => {
  const { format, formatMessage, formatNumber } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  let patientId = result?.get('patientId')
  patientId = !patientId || patientId === 'null' ? 'N/A' : patientId
  const formatterByType = partial(
    // TODO: refactor, see DeviceOperationTableRow
    (formatterBy, type) => formatterBy[type] || formatterBy.default,
    {
      number: n => (isNumber(n) ? formatNumber(n) : false),
      string: t => t && t.split('\n').map(r => <p>{r}</p>),
      default: identity,
    }
  )

  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{result.get('endedOn') ? format(new Date(result.get('endedOn')), dateFormat) : ''}</TableCell>
      <TableCell hiddenOn="xs">{result.get('deviceName')}</TableCell>
      <TableCell hiddenOn="sm">{result.get('sampleOriginSiteName')}</TableCell>
      <TableCell>{result.get('sampleId')}</TableCell>
      <TableCell>{formatMessage(messages[result.get('assayI18nKey')], null, result.get('assayName'))}</TableCell>
      {extraColumns.isEmpty() ? (
        <TableCell>
          {`${formatMessage(
            messages[result.get('resultCategory1Titlei18nKey')],
            null,
            result.get('resultCategory1Title')
          )}:${formatMessage(messages[result.get('resultCategory1I18nKey')], null, result.get('resultCategory1Name'))}`}
          {result.get('resultCategory2I18nKey') &&
            result.get('resultCategory2Titlei18nKey') &&
            ` | ${formatMessage(
              messages[result.get('resultCategory2Titlei18nKey')],
              null,
              result.get('resultCategory2Title')
            )}:${formatMessage(
              messages[result.get('resultCategory2I18nKey')],
              null,
              result.get('resultCategory2Name')
            )}`}
          {result.get('resultCategory2I18nKey') &&
            !result.get('resultCategory2Titlei18nKey') &&
            ` | ${formatMessage(
              messages[result.get('resultCategory2I18nKey')],
              null,
              result.get('resultCategory2Name')
            )}`}
        </TableCell>
      ) : (
        extraColumns.map(column => (
          // TODO: refactor, see DeviceOperationTableRow
          <TableCell key={column.get('i18nKey')} hiddenOn="nd">
            {formatterByType(column.get('type'))(
              column.get('formatter')
                ? formatters[column.get('formatter')](result.get(column.get('fieldName')))
                : result.get(column.get('fieldName'))
            )}
          </TableCell>
        ))
      )}
      <TableCell hiddenOn="lg">{result.get('errorCode')}</TableCell>
      <PermissionsProvider permissions={['+reporter']}>
        <TableCell hiddenOn="md">
          {formatMessage(messages[result.get('resultWorkflowStatusI18nkey')], null, result.get('resultWorkflowStatus'))}
        </TableCell>
      </PermissionsProvider>
      <PermissionsProvider permissions={['+reporter']}>
        <TableCell hiddenOn="md">
          {result.get('treatmentStatusInfo') && (
            <Tooltip
              title={formatMessage(
                messages[result.get('resultTreatmentStatusI18nKey')],
                null,
                result.get('resultTreatmentStatus')
              )}
              disableInteractive
            >
              <PermIdentity className={styles[`${result.get('treatmentStatusInfo')}`]} />
            </Tooltip>
          )}
        </TableCell>
      </PermissionsProvider>
      <TableCell hiddenOn="xs">{patientId}</TableCell>
    </TableRow>
  )
}
export default ResultTableRow
