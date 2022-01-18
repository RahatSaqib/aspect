import React, { Fragment, useState } from 'react'
import Button from '@material-ui/core/Button'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import NotificationDetailModal from '../../../Notifications/Detail/NotificationDetailHistory/NotificationDetailModal'
import IconProvider from '../../../IconProvider/index'
import styles from './ErrorCell.css'

const cssClasses = classnames.bind(styles)
const ErrorCell = ({
  sent = 0,
  withErrors = 0,
  pending = 0,
  recipients,
  formatMessage,
  messages,
  value,
}) => {
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
      )}
    </Fragment>
  )
}

ErrorCell.propTypes = {
  sent: PropTypes.number,
  value: PropTypes.string,
  withErrors: PropTypes.number,
  pending: PropTypes.number,
  recipients: PropTypes.arrayOf(PropTypes.string),
  formatMessage: PropTypes.func.isRequired,
  messages: PropTypes.objectOf(PropTypes.shape).isRequired,
}
ErrorCell.defaultProps = {
  sent: 0,
  withErrors: 0,
  pending: 0,
  recipients: [],
  value: undefined,
}

export default ErrorCell
