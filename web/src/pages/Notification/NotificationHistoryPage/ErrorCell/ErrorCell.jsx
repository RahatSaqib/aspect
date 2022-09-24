import React, { Fragment, useState } from 'react'
import { Button } from '@mui/material'
import classnames from 'classnames/bind'
import { array, arrayOf, number, oneOfType, string } from 'prop-types'
import IconProvider from '../../../../components/IconProvider/index'
import useI18n from '../../../../hooks/useI18n'
import AspectTooltip from '../../../../oldComponents/shared/AspectTooltip'
import styles from './ErrorCell.css'
import messages from './messages'
import NotificationDetailModal from './NotificationDetailModal'

const cssClasses = classnames.bind(styles)

const ErrorCell = ({ sent = 0, withErrors = 0, pending = 0, recipients, value }) => {
  const { formatMessage } = useI18n()
  const [modalConfiguration, setModalConfiguration] = useState({
    showDialog: false,
    sent,
    withErrors,
    pending,
    recipients,
    value,
  })
  const handleClick = () => {
    setModalConfiguration({
      showDialog: !modalConfiguration.showDialog,
      sent,
      withErrors,
      pending,
      recipients,
      value,
    })
  }

  return (
    <Fragment>
      {!modalConfiguration.value ? (
        <div style={{ textAlign: 'center' }}>-</div>
      ) : (
        <AspectTooltip
          title={
            <Fragment>
              <p>
                {sent} {formatMessage(messages.sentSuccessfully)}
              </p>
              <p>
                {withErrors} {formatMessage(messages.sentWithErrors)}
              </p>
              <p>
                {pending} {formatMessage(messages.sentPending)}
              </p>
            </Fragment>
          }
          className={cssClasses('details_statusTooltip')}
        >
          <NotificationDetailModal
            {...modalConfiguration}
            onClose={() => {
              setModalConfiguration({
                ...modalConfiguration,
                showDialog: false,
              })
            }}
          />
          <Button className={cssClasses({ hasError: withErrors })} onClick={handleClick}>
            {sent}/{sent + withErrors + pending}
            <IconProvider icon="MdKeyboardArrowDown" className={cssClasses('popover-cell__icon')} />
          </Button>
        </AspectTooltip>
      )}
    </Fragment>
  )
}

ErrorCell.propTypes = {
  sent: number,
  value: oneOfType([array, number]),
  withErrors: number,
  pending: number,
  recipients: arrayOf(string),
}

ErrorCell.defaultProps = {
  sent: 0,
  withErrors: 0,
  pending: 0,
  recipients: [],
  value: undefined,
}

export default ErrorCell
