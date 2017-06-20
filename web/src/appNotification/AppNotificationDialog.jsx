import PropTypes from 'prop-types'
// Imports from packages
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'
import {
  injectIntl,
  defineMessages,
  FormattedMessage,
  intlShape,
} from 'react-intl'

// Material-UI
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import ErrorIcon from 'material-ui/svg-icons/alert/error'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import InfoIcon from 'material-ui/svg-icons/action/info-outline'
import { lightBlue600, orange500, red800 } from 'material-ui/styles/colors'

// Our own imports
import { hideAppNotification, Error } from './AppNotificationRedux'
import styles from './AppNotificationDialog.css'

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

class AppNotificationDialog extends PureComponent {
  static propTypes = {
    intl: intlShape.isRequired,
    appNotification: PropTypes.objectOf(Error),
    hideAppNotification: PropTypes.func.isRequired,
  }

  static defaultProps = {
    appNotification: null,
  }

  handleClose = () => {
    const onClose = this.props.appNotification.getIn([
      'notificationOptions',
      'onClose',
    ])
    if (onClose) {
      onClose()
    }
    if (this.props.appNotification.get('hasNotification')) {
      this.props.hideAppNotification()
    }
  }

  handleProceed = () => {
    const onProceed = this.props.appNotification.getIn([
      'notificationOptions',
      'onProceed',
    ])
    if (onProceed) {
      onProceed()
    }
    if (this.props.appNotification.get('notificationOptions')) {
      this.props.hideAppNotification()
    }
  }

  render() {
    const { appNotification, intl: { formatMessage } } = this.props

    const toJSOrDefault = (immutableObject, defaultValue) =>
      immutableObject && immutableObject.toJS
        ? immutableObject.toJS()
        : defaultValue
    const appNotificationMessageOrDefault = (messageKey, fallbackMessage) =>
      toJSOrDefault(
        appNotification.getIn(['notificationOptions', messageKey]),
        fallbackMessage
      )

    const notificationOptions = toJSOrDefault(
      appNotification.get('notificationOptions'),
      {}
    )
    const messageValues = toJSOrDefault(
      appNotification.get('messageValues'),
      {}
    )

    const isError =
      appNotification.getIn(['notificationOptions', 'notificationType']) ===
      'error'
    const title = appNotificationMessageOrDefault(
      'title',
      isError ? genericMessages.title : undefined
    )
    const actions = []
    const showProceed = notificationOptions.showProceed
    if (notificationOptions.showClose) {
      const closeText = appNotificationMessageOrDefault(
        'closeText',
        genericMessages.closeText
      )
      actions.push(
        <FlatButton
          label={formatMessage(closeText, messageValues)}
          primary={!showProceed}
          onTouchTap={this.handleClose}
        />
      )
    }
    if (showProceed) {
      const proceedText = appNotificationMessageOrDefault(
        'proceedText',
        genericMessages.proceedText
      )
      actions.push(
        <FlatButton
          label={formatMessage(proceedText, messageValues)}
          primary
          onTouchTap={this.handleProceed}
        />
      )
    }
    const message = appNotificationMessageOrDefault(
      'message',
      isError ? genericMessages.message : undefined
    )
    const resolution = appNotificationMessageOrDefault(
      'resolution',
      isError ? genericMessages.resolution : undefined
    )
    const iconStyle = {
      width: '6em',
      height: '6em',
    }
    const hasNotification = appNotification.get('hasNotification')
    const showDetails = appNotification.get('showDetails')
    return (
      <Dialog
        title={title ? formatMessage(title, messageValues) : ''}
        actions={actions}
        modal={showProceed}
        autoScrollBodyContent
        open={hasNotification && showDetails}
        onRequestClose={this.handleClose}
      >
        {notificationOptions.severity &&
          <div
            className={
              styles.AppNotificationDialogDialog__SeverityIconContainer
            }
          >
            {notificationOptions.severity === 'info' &&
              <InfoIcon style={iconStyle} color={lightBlue600} />}
            {notificationOptions.severity === 'warn' &&
              <WarningIcon style={iconStyle} color={orange500} />}
            {notificationOptions.severity === 'error' &&
              <ErrorIcon style={iconStyle} color={red800} />}
          </div>}
        <div className={styles.AppNotificationDialogDialog__ContentContainer}>
          {message &&
            <p>
              <strong>
                <FormattedMessage {...message} values={messageValues} />
              </strong>
            </p>}
          {resolution &&
            <p>
              <FormattedMessage {...resolution} values={messageValues} />
            </p>}
        </div>
      </Dialog>
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

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AppNotificationDialog)
