import React from 'react'
import PermIdentity from '@mui/icons-material/PermIdentity'
import { Tooltip } from '@mui/material'
import { formatInTimeZone } from 'date-fns-tz'
import identity from 'lodash/identity'
import isEmpty from 'lodash/isEmpty'
import isNumber from 'lodash/isNumber'
import partial from 'lodash/partial'
import { useIntl } from 'react-intl'
import PermissionChecker from '../../../components/PermissionChecker'
import styles from '../../../components/shared/DataTableRow.module.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../components/shared/tableBody'
import formatters from '../formatters'

const ResultTableRow = ({ extraColumns, result, messages, timeZone, ...restProps }) => {
  const { formatMessage, formatNumber } = useIntl()
  let patientId = result?.patientId
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
    <TableRow {...restProps} className={styles[restProps.className]}>
      <TableCell>{result.endedOn ? formatInTimeZone(new Date(result.endedOn), timeZone, 'yyyy-MM-dd') : ''}</TableCell>
      <TableCell hiddenOn="xs">{result.deviceName}</TableCell>
      <TableCell hiddenOn="sm">{result.sampleOriginSiteName}</TableCell>
      <TableCell>{result.sampleId}</TableCell>
      <TableCell>{formatMessage(messages[result.assayI18nKey], null, result.assayName)}</TableCell>
      {isEmpty(extraColumns) ? (
        <TableCell>
          {`${formatMessage(
            messages[result.resultCategory1Titlei18nKey],
            null,
            result.resultCategory1Title
          )}:${formatMessage(messages[result.resultCategory1I18nKey], null, result.resultCategory1Name)}`}
          {result.resultCategory2I18nKey &&
            result.resultCategory2Titlei18nKey &&
            ` | ${formatMessage(
              messages[result.resultCategory2Titlei18nKey],
              null,
              result.resultCategory2Title
            )}:${formatMessage(messages[result.resultCategory2I18nKey], null, result.resultCategory2Name)}`}
          {result.resultCategory2I18nKey &&
            !result.resultCategory2Titlei18nKey &&
            ` | ${formatMessage(messages[result.resultCategory2I18nKey], null, result.resultCategory2Name)}`}
        </TableCell>
      ) : (
        extraColumns.map(column => {
          const columnData = result[column.fieldName]
          return (
            <TableCell key={column.i18nKey} hiddenOn="nd">
              {formatterByType(column.type)(column.formatter ? formatters[column.formatter](columnData) : columnData)}
            </TableCell>
          )
        })
      )}
      <TableCell hiddenOn="lg">{result.errorCode ?? formatMessage(messages.notProvided)}</TableCell>
      <PermissionChecker permissions={['+reporter']}>
        <TableCell hiddenOn="md">
          {result.treatmentStatusInfo && (
            <Tooltip
              title={formatMessage(messages[result.resultTreatmentStatusI18nKey], null, result.resultTreatmentStatus)}
              disableInteractive
            >
              <PermIdentity className={styles[`${result.treatmentStatusInfo}`]} />
            </Tooltip>
          )}
        </TableCell>
      </PermissionChecker>
      <TableCell hiddenOn="xs">{patientId}</TableCell>
    </TableRow>
  )
}
export default ResultTableRow
