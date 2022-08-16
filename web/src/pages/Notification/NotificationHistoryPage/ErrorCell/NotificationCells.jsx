import React from 'react'
import ErrorCell from './ErrorCell'

const WebhookCell = ({ item: { webhookSent, webhookWithErrors, webhookPending, webhookRecipients }, value }) => (
  <ErrorCell
    sent={webhookSent}
    withErrors={webhookWithErrors}
    pending={webhookPending}
    recipients={webhookRecipients}
    value={value}
  />
)

const EmailCell = ({ item: { emailSent, emailWithErrors, emailPending, emailRecipients }, value }) => (
  <ErrorCell
    sent={emailSent}
    withErrors={emailWithErrors}
    pending={emailPending}
    recipients={emailRecipients}
    value={value}
  />
)

const SMSCell = ({ value, item: { smsSent, smsWithErrors, smsPending, smsRecipients } }) => (
  <ErrorCell sent={smsSent} withErrors={smsWithErrors} pending={smsPending} recipients={smsRecipients} value={value} />
)

export { EmailCell, SMSCell, WebhookCell }
