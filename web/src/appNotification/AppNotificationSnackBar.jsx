import PropTypes from 'prop-types'
// Imports from packages
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'
import { injectIntl, defineMessages, intlShape } from 'react-intl'

// Material-UI
import Snackbar from 'material-ui/Snackbar'

// Our own imports
import {
  showMoreDetails,
  hideAppNotification
} from './AppNotificationRedux'

const genericMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.generic.title',
    defaultMessage: 'Aspect has Encountered a Problem.'
  },
  moreDetails: {
    id: 'errorResponseMessages.inline.moreDetails',
    defaultMessage: 'Details...'
  }
})

class AppNotificationSnackBar extends PureComponent {

  static propTypes = {
    intl: intlShape.isRequired,
    appNotification: PropTypes.object,
    showMoreDetails: PropTypes.func.isRequired,
    hideAppNotification: PropTypes.func.isRequired
  }

  static defaultProps = {
    appNotification: null
  }

  handleShowDetails = () => {
    this.props.showMoreDetails()
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

  render() {
    const { appNotification, intl: { formatMessage } } = this.props

    const appNotificationMessageOrDefault = (messageKey, fallbackMessage) => {
      const messageDescriptor = appNotification.getIn(['notificationOptions', messageKey])
      if (messageDescriptor) {
        return messageDescriptor.toJS()
      }
      return fallbackMessage
    }

    const notificationOptions = appNotification.get('notificationOptions') ?
      appNotification.get('notificationOptions').toJS() : {}
    const messageValues = appNotification.get('messageValues')

    const isError = appNotification.getIn(['notificationOptions', 'notificationType']) === 'error'
    const title = appNotificationMessageOrDefault('title', isError ? genericMessages.title : undefined)
    const showProceed = notificationOptions.showProceed
    const message = appNotificationMessageOrDefault('message', isError ? genericMessages.message : undefined)
    const resolution = appNotificationMessageOrDefault('resolution', isError ? genericMessages.resolution : undefined)
    const actionText = showProceed || message || resolution ?
      formatMessage(genericMessages.moreDetails) : undefined
    const actionTouchTap = showProceed || message || resolution ?
      this.handleShowDetails : undefined

    const hasNotification = appNotification.get('hasNotification')
    const showDetails = appNotification.get('showDetails')
    return (
      <Snackbar
        open={hasNotification && !showDetails}
        message={title ? formatMessage(title, messageValues) : ''}
        autoHideDuration={4000}
        action={actionText}
        onActionTouchTap={actionTouchTap}
        onRequestClose={this.handleClose}
      />
    )
  }
}

function mapStateToProps(state) {
  return {
    appNotification: state.get('appNotification')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showMoreDetails,
    hideAppNotification
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AppNotificationSnackBar)
