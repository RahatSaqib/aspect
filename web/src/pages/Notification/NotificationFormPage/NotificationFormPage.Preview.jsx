import React from 'react'
import isString from 'lodash/isString'
import { useIntl } from 'react-intl'
import { getCronHumanValue } from '../../../components'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import usePersonList from '../../../hooks/person/usePersonList'
import jobFunctionsMessages from '../../../messages/jobFunctionMessages'
import messages from './messages'

const rowStyle = { display: 'flex', alignItems: 'flex-start' }
const labelStyle = { margin: '3px 10px 3px 0px' }

const NotificationFormPreview = ({ values }) => {
  const { locale, formatMessage } = useIntl()
  const { data: jobFunctions, isLoading: isJfLoading } = useJobFunctions()
  const { data: personList, isLoading: isPersonListLoading } = usePersonList()

  return (
    <>
      <h2>{formatMessage(messages.previewNotification)}</h2>
      <span style={rowStyle}>
        <h4 style={labelStyle}>{formatMessage(messages.notificationTitle)}:</h4>
        <span style={labelStyle}>{values.name}</span>
      </span>

      {values.notificationType === 'resultBased' ? (
        <>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.triggerConditionTitle)}:</h4>
            <span style={labelStyle}>
              {values.resultBasedScope === 'created'
                ? formatMessage(messages.triggerWhenForResultCreated)
                : values.resultBasedScope === 'updated'
                ? formatMessage(messages.triggerWhenForResultUpdated)
                : values.resultBasedScope === 'any'
                ? formatMessage(messages.triggerWhenResultCreatedOrUpdated)
                : null}
            </span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.whenResultIs)}:</h4>
            <span>
              {values.result.map((p, index) => (
                <span style={{ ...labelStyle, display: 'block' }} key={index}>
                  {p.assayId ? formatMessage(messages[p.assayId]) : ''}{' '}
                  {(p.resultCategoryId || []).map(r => r.label).join(', ')}
                </span>
              ))}
            </span>
          </span>
        </>
      ) : null}

      {values.notificationType === 'reportBased' ? (
        <>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.reportBaseType)}:</h4>
            <span style={labelStyle}>
              {values.reportId ? formatMessage(messages[values.reportId]) : null}{' '}
              {getCronHumanValue(values.cronRecurrency?.cronExpression, locale)}
            </span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.dataDateRange)}:</h4>
            <span style={labelStyle}>
              {values.reportDateRange
                ? formatMessage(
                    messages[
                      values.reportDateRange === 'PREVIOUS_CALENDAR_DAY'
                        ? 'frequencyDailyPreviousCalendarDay'
                        : values.reportDateRange === 'PREVIOUS_WEEK_DAY'
                        ? 'frequencyDailyPreviousWeekDay'
                        : values.reportDateRange === 'PREVIOUS_7_DAYS'
                        ? 'frequencyWeeklyPrevious7Days'
                        : values.reportDateRange === 'PREVIOUS_WEEK'
                        ? 'frequencyWeeklyPreviousWeek'
                        : values.reportDateRange === 'PREVIOUS_MONTH'
                        ? 'frequencyMonthlyPreviousMonth'
                        : values.reportDateRange === 'PREVIOUS_QUARTER'
                        ? 'frequencyQuarterlyPreviousQuarter'
                        : values.reportDateRange === 'PREVIOUS_YEAR'
                        ? 'frequencyYearlyPreviousYear'
                        : ''
                    ]
                  )
                : null}
            </span>
          </span>
        </>
      ) : null}

      {values.notificationType === 'InventoryStockout' ? (
        <span style={rowStyle}>
          <h4 style={labelStyle}>{formatMessage(messages.whenDeviceHasLessThan)}:</h4>
          <span style={labelStyle}>
            {values.daysOfInventoryLeft} {formatMessage(messages.daysOfInventoryLeft)}
          </span>
        </span>
      ) : null}

      {values.notificationType === 'InventoryStockExpiring' ? (
        <span style={rowStyle}>
          <h4 style={labelStyle}>
            {formatMessage(messages.stockExpiring)} {formatMessage(messages.daysStockExpiring)}:
          </h4>
          <span style={labelStyle}>{values.daysOfInventoryLeft}</span>
        </span>
      ) : null}

      {values.notificationType === 'DeviceNoResults' ? (
        <span style={rowStyle}>
          <h4 style={labelStyle}>{formatMessage(messages.whenDeviceDidNotSendResultsForMoreThan)}:</h4>
          <span style={labelStyle}>
            {values.daysNoResults} {formatMessage(messages.daysWithoutResults)}
          </span>
        </span>
      ) : null}

      {values.notificationType === 'DeviceOffline' ? (
        <span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.whenDeviceHasBeenInactiveForMoreThan)}:</h4>
            <span style={labelStyle}>
              {values.daysInactive} {formatMessage(messages.daysInactive)}
            </span>
          </span>

          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.repeatCheckAndNotifyInactive)}:</h4>
            <span style={labelStyle}>
              {values.recurrenceFactor} {formatMessage(messages.recurrenceFactor)}
            </span>
          </span>
        </span>
      ) : null}

      {values.notificationType === 'CalibrationDueDate' ? (
        <span style={rowStyle}>
          <h4 style={labelStyle}>{formatMessage(messages.calibrationDays)}:</h4>
          <span style={labelStyle}>
            {values.daysBeforeCalibrationDueDate} {formatMessage(messages.daysBeforeCalibrationDueDate)}
          </span>
        </span>
      ) : null}

      {values.sendEmail ? (
        <>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.send)}:</h4>
            <span style={labelStyle}>{formatMessage(messages.email)}</span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.emailSubject)}:</h4>
            <span style={labelStyle}>
              <ParsedString value={values.emailSubject} />
            </span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.emailBody)}:</h4>
            <span style={labelStyle}>
              <ParsedString value={values.emailBody} />
            </span>
          </span>
        </>
      ) : null}
      {values.sendSms ? (
        <>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.send)}:</h4>
            <span style={labelStyle}>{formatMessage(messages.sms)}</span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.smsBody)}:</h4>
            <span style={labelStyle}>
              <ParsedString value={values.smsBody} />
            </span>
          </span>
        </>
      ) : null}
      {values.sendWeb ? (
        <>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.send)}:</h4>
            <span style={labelStyle}>{formatMessage(messages.web)}</span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.webUrl)}:</h4>
            <span style={labelStyle}>{values.webUrl}</span>
          </span>
          <span style={rowStyle}>
            <h4 style={labelStyle}>{formatMessage(messages.webBody)}:</h4>
            <span style={labelStyle}>
              <ParsedString value={values.webBody} />
            </span>
          </span>
        </>
      ) : null}
      <span style={rowStyle}>
        <h4 style={labelStyle}>{formatMessage(messages.personsSelectLabel)}:</h4>
        <span>
          {!isPersonListLoading
            ? (values.persons || []).map((p, index) => {
                const person = personList.find(pl => (isString(p) ? pl.id === p : pl.id === p.value)) || { name: '' }
                return (
                  <span style={{ ...labelStyle, display: 'block' }} key={index}>{`${person.name} ${
                    person.state ? `(${person.state})` : ''
                  }`}</span>
                )
              })
            : null}
        </span>
      </span>
      <span style={rowStyle}>
        <h4 style={labelStyle}>{formatMessage(messages.sendToPatient)}:</h4>
        <span style={labelStyle}>{formatMessage(messages[values.sendToPatient ? 'yes' : 'no'])}</span>
      </span>
      <span style={rowStyle}>
        <h4 style={labelStyle}>{formatMessage(messages.toAnyOfTheseJobFunctions)}:</h4>
        {!isJfLoading ? (
          <span>
            {values.jobFunctions
              .filter(jf => jf.checked)
              .map((jf, index) => {
                return (
                  <span style={{ ...labelStyle, display: 'block' }} key={index}>
                    {formatMessage(jobFunctionsMessages[jobFunctions.find(j => j.id === jf.jobFunctionId).externalId])}{' '}
                    {jf.tags.length
                      ? `(${jf.tags.map((tag, index2) => (
                          <span style={{ ...labelStyle, display: 'block' }} key={index2}>
                            {tag.label}
                          </span>
                        ))})`
                      : null}
                  </span>
                )
              })}
          </span>
        ) : null}
      </span>
    </>
  )
}

export default NotificationFormPreview

/**
 * Example
 * Input: "hello {{5}} {{site.name}} world {{device.name}} {{}}"
 * Output: "hello 5 SiteName world DeviceName {{}}"
 * */
const replacePlaceholdersWithPascalCase = text => {
  const placeholderRegex = /{{.+?}}/g

  return text.replace(placeholderRegex, match => {
    return match
      .replace('{{', '')
      .replace('}}', '')
      .split('.')
      .map(w => w[0].toUpperCase() + w.substring(1))
      .join('')
  })
}

const ParsedString = ({ value }) => {
  const generateParagraph = line => (
    <p style={{ margin: 0 }} key={line}>
      {line}
    </p>
  )

  const text = replacePlaceholdersWithPascalCase(value || '')
  const lines = text.split('\n')

  return lines.map(line => generateParagraph(line))
}
