import React, { PureComponent } from 'react'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'
import WarningIcon from '@mui/icons-material/Warning'
import { Button } from '@mui/material'
import { lightBlue, orange, red } from '@mui/material/colors'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { hideAppNotification, Error } from '../../store/AppNotificationRedux'
import PropTypeOf from '../../utils/types'
import AspectDialog from '../shared/AspectDialog'
import styles from './AppNotificationDialog.module.css'

const genericMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.generic.title',
    defaultMessage: 'Aspect has Encountered a Problem.',
  },
  message: {
    id: 'errorResponseMessages.generic.message',
    defaultMessage: 'Our technical team has been notified of the problem and will attend to it as soon as possible.',
  },
  closeText: {
    id: 'errorResponseMessages.generic.closeText',
    defaultMessage: 'Close',
  },
  proceedText: {
    id: 'errorResponseMessages.generic.proceedText',
    defaultMessage: 'Proceed',
  },
})

const enhance = flowRight(injectIntl, connect(mapStateToProps, mapDispatchToProps))

class AppNotificationDialog extends PureComponent {
  static propTypes = {
    intl: PropTypeOf.intl.isRequired,
    appNotification: PropTypes.objectOf(Error),
    hideAppNotification: PropTypes.func.isRequired,
  }

  static defaultProps = {
    appNotification: null,
  }

  handleClose = () => {
    const onClose = this.props.appNotification.getIn(['notificationOptions', 'onClose'])
    if (onClose) {
      onClose()
    }
    if (this.props.appNotification.get('hasNotification')) {
      this.props.hideAppNotification()
    }
  }

  handleProceed = () => {
    const onProceed = this.props.appNotification.getIn(['notificationOptions', 'onProceed'])
    if (onProceed) {
      onProceed()
    }
    if (this.props.appNotification.get('notificationOptions')) {
      this.props.hideAppNotification()
    }
  }

  render() {
    const {
      appNotification,
      intl: { formatMessage },
    } = this.props

    const toJSOrDefault = (immutableObject, defaultValue) =>
      immutableObject && immutableObject.toJS ? immutableObject.toJS() : defaultValue
    const appNotificationMessageOrDefault = (messageKey, fallbackMessage) =>
      toJSOrDefault(appNotification.getIn(['notificationOptions', messageKey]), fallbackMessage)

    const notificationOptions = toJSOrDefault(appNotification.get('notificationOptions'), {})
    const messageValues = toJSOrDefault(appNotification.get('messageValues'), {})

    const isError = appNotification.getIn(['notificationOptions', 'notificationType']) === 'error'
    const title = appNotificationMessageOrDefault('title', isError ? genericMessages.title : undefined)
    const actions = []
    const { showProceed } = notificationOptions
    if (notificationOptions.showClose) {
      const closeText = appNotificationMessageOrDefault('closeText', genericMessages.closeText)
      actions.push(
        <Button color={!showProceed ? 'primary' : ''} onClick={this.handleClose}>
          {formatMessage(closeText, messageValues)}
        </Button>
      )
    }
    if (showProceed) {
      const proceedText = appNotificationMessageOrDefault('proceedText', genericMessages.proceedText)
      actions.push(
        <Button color="primary" onClick={this.handleProceed}>
          {formatMessage(proceedText, messageValues)}
        </Button>
      )
    }
    const message = appNotificationMessageOrDefault('message', isError ? genericMessages.message : undefined)
    const resolution = appNotificationMessageOrDefault('resolution', isError ? genericMessages.resolution : undefined)
    const iconStyle = {
      width: '6em',
      height: '6em',
    }
    const hasNotification = appNotification.get('hasNotification')
    const showDetails = appNotification.get('showDetails')
    return (
      <AspectDialog
        title={title ? formatMessage(title, messageValues) : ''}
        actions={actions}
        modal={showProceed}
        autoScrollBodyContent
        open={hasNotification && showDetails}
        onRequestClose={this.handleClose}
      >
        {notificationOptions.severity && (
          <div className={styles.AppNotificationDialogDialog__SeverityIconContainer}>
            {notificationOptions.severity === 'info' && <InfoIcon style={{ ...iconStyle, color: lightBlue[600] }} />}
            {notificationOptions.severity === 'warn' && <WarningIcon style={{ ...iconStyle, color: orange[500] }} />}
            {notificationOptions.severity === 'error' && <ErrorIcon style={{ ...iconStyle, color: red[800] }} />}
          </div>
        )}
        <div className={styles.AppNotificationDialogDialog__ContentContainer}>
          {message && (
            <p>
              <strong>
                <FormattedMessage {...message} values={messageValues} />
              </strong>
            </p>
          )}
          {resolution && (
            <p>
              <FormattedMessage {...resolution} values={messageValues} />
            </p>
          )}
        </div>
      </AspectDialog>
    )
  }
}

function mapStateToProps(state) {
  return {
    appNotification: state.get('appNotification'),
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      hideAppNotification,
    },
    dispatch
  )
}

export default enhance(AppNotificationDialog)
