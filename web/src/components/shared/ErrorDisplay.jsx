// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'

// Material-UI
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import {
  removeError,
  hideErrorNotification
} from '../../error/ErrorRedux'

const genericErrorMessages = defineMessages({
  title: {
    id: 'responseMessages.generic.title',
    defaultMessage: 'Aspect has Encountered a Problem.'
  },
  message: {
    id: 'responseMessages.generic.title',
    defaultMessage: 'Our technical team has been notified of the problem and will attend to it as soon as possible.'
  },
  closeText: {
    id: 'responseMessages.generic.closeText',
    defaultMessage: 'Close'
  },
  proceedText: {
    id: 'responseMessages.generic.proceedText',
    defaultMessage: 'Proceed'
  }
})

export class ErrorDisplay extends PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    error: PropTypes.object,
    removeError: PropTypes.func.isRequired,
    hideErrorNotification: PropTypes.func.isRequired
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

    const errorDetails = error.getIn(['errorNotification', 'error']) || {}
    const actions = []
    if (error.getIn(['errorNotification', 'showClose'])) {
      const closeText = errorNotificationMessage('closeText', genericErrorMessages.closeText)
      actions.push(<FlatButton
        label={formatMessage(closeText, errorDetails)}
        primary={!error.getIn(['errorNotification', 'showProceed'])}
        onTouchTap={this.handleClose}
      />)
    }
    if (error.getIn(['errorNotification', 'showProceed'])) {
      const proceedText = errorNotificationMessage('proceedText', genericErrorMessages.proceedText)
      actions.push(<FlatButton
        label={formatMessage(proceedText, errorDetails)}
        primary
        onTouchTap={this.handleProceed}
      />)
    }
    const title = errorNotificationMessage('title', genericErrorMessages.title)
    const message = errorNotificationMessage('message', genericErrorMessages.message)
    const resolution = errorNotificationMessage('resolution', genericErrorMessages.resolution)
    return (
      <Dialog
        title={formatMessage(title, errorDetails)}
        actions={actions}
        modal={false}
        open={error.get('errorNotification') !== null}
        onRequestClose={this.handleClose}
      >
        <p>
          <strong
            dangerouslySetInnerHTML={{
              __html: formatMessage(message, errorDetails)
            }}
          />
        </p>
        { resolution &&
          <p dangerouslySetInnerHTML={{ __html: formatMessage(resolution, errorDetails) }} />
        }
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
    hideErrorNotification
  }, dispatch)
}

export const ErrorDisplayContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ErrorDisplay)
