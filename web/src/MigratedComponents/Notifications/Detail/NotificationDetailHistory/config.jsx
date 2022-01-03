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
import React, { Fragment, useState } from 'react'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import PropTypes from 'prop-types'
import messages from './messages'
import { DateTimeCell } from '../../../AspectTable/TableCell/DateTimeCell'
import styles from '../NotificationDetail.css'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import NotificationDetailModal from './NotificationDetailModal'
import IconProvider from '../../../IconProvider/index'

const cssClasses = classnames.bind(styles)

const ErrorCell = ({
  sent = 0,
  withErrors = 0,
  pending = 0,
  recipients,
  formatMessage,
}) => {
  const [modalConfiguration, setModalConfiguration] = useState({
    showDialog: false,
    sent,
    withErrors,
    pending,
    recipients,
  })
  const handleClick = () => {
    setModalConfiguration({
      showDialog: !modalConfiguration.showDialog,
      sent,
      withErrors,
      pending,
      recipients,
    })
  }
  return (
    <Fragment>
      <AspectTooltip
        title={
          <>
            <p>
              {sent} {formatMessage(messages.sentSuccessfully)}
            </p>
            <p>
              {withErrors} {formatMessage(messages.sentWithErrors)}
            </p>
            <p>
              {pending} {formatMessage(messages.sentPending)}
            </p>
          </>
        }
        className={cssClasses('details_statusTooltip')}
      >
        <NotificationDetailModal
          {...modalConfiguration}
          onClose={() => {
            setModalConfiguration({})
          }}
        />
        <Button
          className={cssClasses({ hasError: withErrors })}
          onClick={handleClick}
        >
          {sent}/{sent + withErrors + pending}
          <IconProvider
            icon="MdKeyboardArrowDown"
            className={cssClasses('popover-cell__icon')}
          />
        </Button>
      </AspectTooltip>
    </Fragment>
  )
}

ErrorCell.propTypes = {
  sent: PropTypes.number,
  withErrors: PropTypes.number,
  pending: PropTypes.number,
  recipients: PropTypes.arrayOf(PropTypes.string),
  formatMessage: PropTypes.func.isRequired,
}
ErrorCell.defaultProps = {
  sent: 0,
  withErrors: 0,
  pending: 0,
  recipients: [],
}

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
          return !value ? (
            <div style={{ textAlign: 'center' }}>-</div>
          ) : (
            <Fragment>
              <ErrorCell
                sent={webhookSent}
                withErrors={webhookWithErrors}
                pending={webhookPending}
                recipients={webhookRecipients}
                formatMessage={formatMessage}
              />
            </Fragment>
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
          return !value ? (
            <div style={{ textAlign: 'center' }}>-</div>
          ) : (
            <Fragment>
              <ErrorCell
                sent={emailSent}
                withErrors={emailWithErrors}
                pending={emailPending}
                recipients={emailRecipients}
                formatMessage={formatMessage}
              />
            </Fragment>
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
        }) =>
          !value ? (
            <div style={{ textAlign: 'center' }}>-</div>
          ) : (
            <Fragment>
              <ErrorCell
                sent={smsSent}
                withErrors={smsWithErrors}
                pending={smsPending}
                recipients={smsRecipients}
                formatMessage={formatMessage}
              />
            </Fragment>
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
