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
import React, { Fragment } from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'

import messages from './messages'
import { DateTimeCell } from '../../../AspectTable/TableCell/DateTimeCell'
import PopoverCell from '../../../AspectTable/TableCell/PopoverCell'

const baseConfig = ({ formatMessage }) => ({
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
        item: { webhookSent, webhookWithErrors, webhookPending },
        value,
      }) => {
        const total = webhookWithErrors + webhookSent + webhookPending
        return !value ? (
          <div style={{ textAlign: 'center' }}>-</div>
        ) : (
          <PopoverCell label={`${webhookSent}/${total}`}>
            <Fragment>
              <h4>{formatMessage(messages.emailSentTo)}</h4>
              {value.map(name => (
                <div key={name}>-{name}</div>
              ))}
            </Fragment>
          </PopoverCell>
        )
      },
    },
    {
      key: 'emailRecipients',
      label: formatMessage(messages.eventsTableHeaderEmailSent),
      width: 10,
      disableHide: true,
      disableGroupBy: true,
      format: ({
        item: { emailSent, emailWithErrors, emailPending },
        value,
      }) => {
        const total = emailSent + emailWithErrors + emailPending
        return !value ? (
          <div style={{ textAlign: 'center' }}>-</div>
        ) : (
          <PopoverCell
            label={`${emailSent}/${emailWithErrors + emailSent + emailPending}`}
          >
            <Fragment>
              <h4>
                {formatMessage(messages.emailSentTo)}
                <LinearProgress variant="buffer" value={50} valueBuffer={60} />
              </h4>
              <div>
                <h5>Total of email sent: {`${total}`}</h5>
                <h6>With Errors: {`${emailWithErrors}`}</h6>
                <h6>Pending emails: {`${emailPending}`}</h6>
              </div>
              {value.map(name => (
                <div key={name}>- {name}</div>
              ))}
            </Fragment>
          </PopoverCell>
        )
      },
    },
    {
      key: 'smsRecipients',
      label: formatMessage(messages.eventsTableSmsSent),
      width: 10,
      disableHide: true,
      disableGroupBy: true,
      format: ({ value, item: { smsSent, smsWithErrors, smsPending } }) =>
        !value ? (
          <div style={{ textAlign: 'center' }}>-</div>
        ) : (
          <PopoverCell
            label={`${smsSent}/${smsSent + smsWithErrors + smsPending}`}
          >
            <Fragment>
              <h4>{formatMessage(messages.smsSentTo)}</h4>
              {value.map(name => (
                <div key={name}>- {name}</div>
              ))}
            </Fragment>
          </PopoverCell>
        ),
    },
  ],
  columnOrder: {
    allow: false,
    initialOrder: ['date'],
    initialOrderDesc: true,
  },
})

export default baseConfig
