/**
 * name: 'string' [self defined, required]
 * columns: 'array' [self-defined, required]
 *  key: 'string' [self defined, required]
 *  filterKey: 'string' [self defined, optional for filtering]
 *  label: 'string' [self defined, required]
 *  width: 'number' [self defined, optional]
 *  disableHide: 'boolean' [react-table, optional default false]
 *  disableGroupBy: 'boolean' [react-table, optional default false]
 *  disableSortBy: 'boolean' [react-table, optional default false]
 *  aggregate: 'function' [self defined|react-table, optional for calcs]
 *  Aggregated: 'function' [self defined, optional for calcs]
 *  format: 'function|react component' [self defined, optional for calcs]
 * columnOrder: 'object' [self defined, optional]
 *  allow: 'bool' [self defined, optional default true]
 *  initialOrder: 'array' [self defined, optional]
 * contextualMenu: 'function|component' [self defined, optional]
 */
import React from 'react'
import messages from './messages'
import { DateTimeCell } from '../../../AspectTable/TableCell/DateTimeCell'
import ErrorCell from '../../../AspectTable/TableCell/ErrorCell/index'

const baseConfig = ({ formatMessage }) => {
  return {
    name: formatMessage(messages.event),
    namePlural: formatMessage(messages.events),
    columns: [
      {
        key: 'date',
        label: formatMessage(messages.eventsTableHeaderDate),
        width: 40,
        disableHide: true,
        disableGroupBy: true,
        format: DateTimeCell,
      },
      {
        key: 'sampleId',
        label: formatMessage(messages.sampleId),
        width: 20,
        disableHide: true,
        disableGroupBy: true,
      },
      {
        key: 'patientId',
        label: formatMessage(messages.patientId),
        width: 20,
        disableHide: true,
        disableGroupBy: true,
        link: {
          key: 'resultId',
          url: '/browse/result/:resultId',
        },
      },
      {
        key: 'webhookSent',
        label: formatMessage(messages.eventsTableWebhookSent),
        width: 10,
        disableHide: true,
        disableGroupBy: true,
        format: ({
          item: {
            webhookSent,
            webhookWithErrors,
            webhookPending,
            webhookRecipients,
          },
          value,
        }) => {
          return (
            <ErrorCell
              sent={webhookSent}
              withErrors={webhookWithErrors}
              pending={webhookPending}
              recipients={webhookRecipients}
              formatMessage={formatMessage}
              messages={messages}
              value={value}
            />
          )
        },
      },
      {
        key: 'emailRecipients',
        label: formatMessage(messages.eventsTableHeaderEmailSent),
        width: 5,
        disableHide: true,
        disableGroupBy: true,
        format: ({ item, value }) => {
          const { emailSent, emailWithErrors, emailPending, emailRecipients } =
            item
          return (
            <ErrorCell
              sent={emailSent}
              withErrors={emailWithErrors}
              pending={emailPending}
              recipients={emailRecipients}
              formatMessage={formatMessage}
              messages={messages}
              value={value}
            />
          )
        },
      },
      {
        key: 'smsRecipients',
        label: formatMessage(messages.eventsTableSmsSent),
        width: 5,
        disableHide: true,
        disableGroupBy: true,
        format: ({
          value,
          item: { smsSent, smsWithErrors, smsPending, smsRecipients },
        }) => (
          <ErrorCell
            sent={smsSent}
            withErrors={smsWithErrors}
            pending={smsPending}
            recipients={smsRecipients}
            formatMessage={formatMessage}
            messages={messages}
            value={value}
          />
        ),
      },
    ],
    columnOrder: {
      allow: false,
      initialOrder: ['date'],
      initialOrderDesc: true,
    },
  }
}
export default baseConfig
