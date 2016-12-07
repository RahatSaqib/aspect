// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'

// Material-UI
import Dialog from 'material-ui/Dialog'
import Snackbar from 'material-ui/Snackbar'
import FlatButton from 'material-ui/FlatButton'
import ErrorIcon from 'material-ui/svg-icons/alert/error'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import InfoIcon from 'material-ui/svg-icons/action/info-outline'
import { lightBlue600, orange500, red800 } from 'material-ui/styles/colors'

// Our own imports
import {
  removeError,
  showMoreDetails,
  hideErrorNotification
} from '../../error/ErrorRedux'
import styles from './ErrorDisplay.css'

const genericErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.generic.title',
    defaultMessage: 'Aspect has Encountered a Problem.'
  },
  message: {
    id: 'errorResponseMessages.generic.title',
    defaultMessage: 'Our technical team has been notified of the problem and will attend to it as soon as possible.'
  },
  closeText: {
    id: 'errorResponseMessages.generic.closeText',
    defaultMessage: 'Close'
  },
  proceedText: {
    id: 'errorResponseMessages.generic.proceedText',
    defaultMessage: 'Proceed'
  },
  moreDetails: {
    id: 'errorResponseMessages.inline.moreDetails',
    defaultMessage: 'Details...'
  }
})

export class ErrorDisplay extends PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    error: PropTypes.object,
    removeError: PropTypes.func.isRequired,
    showMoreDetails: PropTypes.func.isRequired,
    hideErrorNotification: PropTypes.func.isRequired
  }

  handleShowDetails = () => {
    this.props.showMoreDetails()
  }

  handleClose = () => {
    const onClose = this.props.error.getIn(['errorNotification', 'onClose'])
    if (onClose) {
      onClose()
    }
    if (this.props.error.get('errorNotification')) {
      this.props.hideErrorNotification()
    }
    // TODO: Refactor this out
    if (this.props.error.get('hasError')) {
      this.props.removeError()
    }
  }

  handleProceed = () => {
    const onProceed = this.props.error.getIn(['errorNotification', 'onProceed'])
    if (onProceed) {
      onProceed()
    }
    if (this.props.error.get('errorNotification')) {
      this.props.hideErrorNotification()
    }
  }

  render() {
    const { error, intl: { formatMessage } } = this.props

    if (error.get('hasError')) {
      // TODO: Refactor this out
      const actions = [
        <FlatButton
          label="Close"
          primary
          onTouchTap={this.handleClose}
        />
      ]
      const errorMessage = error.get('message')
      return (
        <Dialog
          title={error.get('title')}
          actions={actions}
          modal={false}
          open={error.get('hasError')}
          onRequestClose={this.handleClose}
        >
          {_.isString(errorMessage) ? <span dangerouslySetInnerHTML={{ __html: errorMessage }} /> : JSON.stringify(errorMessage, null, '\t')}
        </Dialog>
      )
    }

    const errorNotificationMessage = (messageKey, fallbackMessage) => {
      const messageDescriptor = error.getIn(['errorNotification', messageKey])
      if (messageDescriptor) {
        return messageDescriptor.toJS()
      }
      return fallbackMessage
    }

    const errorNotification = error.get('errorNotification') ? error.get('errorNotification').toJS() : {}
    const errorObject = { ...(error.get('error') ? error.get('error').toJS() : {}), ...errorNotification.messageValues }
    const title = errorNotificationMessage('title', genericErrorMessages.title)
    const showErrorDetails = error.get('showDetails')
    if (_.isEmpty(errorNotification) && !showErrorDetails) {
      return (
        <Snackbar
          open
          message={formatMessage(title, errorObject)}
          autoHideDuration={4000}
          action={formatMessage(genericErrorMessages.moreDetails)}
          onActionTouchTap={this.handleShowDetails}
          onRequestClose={() => this.handleClose}
        />
      )
    }
    const actions = []
    const showProceed = errorNotification.showProceed
    if (errorNotification.showClose) {
      const closeText = errorNotificationMessage('closeText', genericErrorMessages.closeText)
      actions.push(<FlatButton
        label={formatMessage(closeText, errorObject)}
        primary={!showProceed} onTouchTap={this.handleClose}
      />)
    }
    if (showProceed) {
      const proceedText = errorNotificationMessage('proceedText', genericErrorMessages.proceedText)
      actions.push(<FlatButton
        label={formatMessage(proceedText, errorObject)}
        primary onTouchTap={this.handleProceed}
      />)
    }
    const message = errorNotificationMessage('message', genericErrorMessages.message)
    const resolution = errorNotificationMessage('resolution', genericErrorMessages.resolution)
    const iconStyle = {
      width: '6em',
      height: '6em'
    }
    return (
      <Dialog
        title={formatMessage(title, errorObject)}
        actions={actions}
        modal={showProceed}
        autoScrollBodyContent
        open={showErrorDetails}
        onRequestClose={this.handleClose}
      >
        {
          errorNotification.severity &&
            <div className={styles.ErrorDisplay__Dialog__SeverityIconContainer}>
              {
                errorNotification.severity === 'info' &&
                <InfoIcon style={iconStyle} color={lightBlue600} />
              }
              {
                errorNotification.severity === 'warn' &&
                <WarningIcon style={iconStyle} color={orange500} />
              }
              {
                errorNotification.severity === 'error' &&
                <ErrorIcon style={iconStyle} color={red800} />
              }
            </div>
        }
        <div className={styles.ErrorDisplay__Dialog__ContentContainer}>
          <p>
            <strong
              dangerouslySetInnerHTML={{
                __html: formatMessage(message, errorObject)
              }}
            />
          </p>
          { resolution &&
            <p dangerouslySetInnerHTML={{ __html: formatMessage(resolution, errorObject) }} />
          }
        </div>
      </Dialog>
    )
  }
}

function mapStateToProps(state) {
  return {
    error: state.get('error')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    removeError,
    showMoreDetails,
    hideErrorNotification
  }, dispatch)
}

export const ErrorDisplayContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ErrorDisplay)
