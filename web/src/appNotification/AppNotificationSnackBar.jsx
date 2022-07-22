import PropTypes from 'prop-types'
// Imports from packages
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import flowRight from 'lodash/flowRight'
import classNames from 'classnames'
import { defineMessages, injectIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import { green, amber } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/styles'

// Our own imports
import { showMoreDetails, hideAppNotification, Error } from './AppNotificationRedux'
import PropTypeOf from '../shared/types'

const genericMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.generic.title',
    defaultMessage: 'Aspect has Encountered a Problem.',
  },
  moreDetails: {
    id: 'errorResponseMessages.inline.moreDetails',
    defaultMessage: 'Details...',
  },
})

const enhance = flowRight(injectIntl, connect(mapStateToProps, mapDispatchToProps))

const styles = {
  info: {
    color: green[600],
  },
  warning: {
    color: amber[700],
  },
}

export class AppNotificationSnackBar extends PureComponent {
  static propTypes = {
    intl: PropTypeOf.intl.isRequired,
    appNotification: PropTypes.objectOf(Error),
    classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    showMoreDetails: PropTypes.func.isRequired,
    hideAppNotification: PropTypes.func.isRequired,
  }

  static defaultProps = {
    appNotification: null,
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
    const {
      classes: classNameValues,
      appNotification,
      intl: { formatMessage },
    } = this.props

    const appNotificationMessageOrDefault = (messageKey, fallbackMessage) => {
      const messageDescriptor = appNotification.getIn(['notificationOptions', messageKey])
      if (messageDescriptor) {
        return messageDescriptor.toJS()
      }
      return fallbackMessage
    }

    const notificationOptions = appNotification.get('notificationOptions')
      ? appNotification.get('notificationOptions').toJS()
      : {}
    const messageValues = appNotification.get('messageValues')

    const isError = appNotification.getIn(['notificationOptions', 'notificationType']) === 'error'
    const title = appNotificationMessageOrDefault('title', isError ? genericMessages.title : undefined)
    const { showProceed } = notificationOptions
    const message = appNotificationMessageOrDefault('message', isError ? genericMessages.message : undefined)
    const resolution = appNotificationMessageOrDefault('resolution', isError ? genericMessages.resolution : undefined)
    const actionText = showProceed || message || resolution ? formatMessage(genericMessages.moreDetails) : undefined
    const actionTouchTap = showProceed || message || resolution ? this.handleShowDetails : undefined

    const hasNotification = appNotification.get('hasNotification')
    const showDetails = appNotification.get('showDetails')
    return (
      <Snackbar
        className={classNames(classNameValues.fullWidth)}
        open={hasNotification && !showDetails}
        message={title ? formatMessage(title, messageValues) : ''}
        autoHideDuration={4000}
        onClose={this.handleClose}
        type={isError ? 'warning' : 'accept'}
        action={
          <Button
            className={classNames({
              [classNameValues.info]: !isError,
              [classNameValues.warning]: isError,
            })}
            size="small"
            onClick={actionTouchTap}
          >
            {actionText ? actionText.toUpperCase() : actionText}
          </Button>
        }
      />
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
      showMoreDetails,
      hideAppNotification,
    },
    dispatch
  )
}

export const StyledAppNotificationSnackBar = withStyles(styles)(AppNotificationSnackBar)

export default enhance(StyledAppNotificationSnackBar)
