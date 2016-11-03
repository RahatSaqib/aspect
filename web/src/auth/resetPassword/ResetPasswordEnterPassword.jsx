// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {Link} from 'react-router'
import Helmet from 'react-helmet'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

// Material-UI
import Paper from 'material-ui/Paper'
import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import { ErrorDisplayContainer } from '../../components/shared/ErrorDisplay'
import { AcknowledgementDisplay } from '../../components/shared/AcknowledgementDisplay'
import { resetPasswordEnterEmailAddress, resetPasswordEnterPassword } from '../AuthRedux'
import { addAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'
import styles from './ResetPassword.css'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'

const messages = defineMessages({
  title: {
    id: 'pages.ResetPassword.title',
    defaultMessage: 'Reset Password'
  },
  enterRegisteredEmailAddress: {
    id: 'pages.ResetPassword.enterRegisteredEmailAddress',
    defaultMessage: 'Please enter the email address that you are registered with'
  },
  emailAddress: {
    id: 'pages.ResetPassword.emailAddress',
    defaultMessage: 'Email Address'
  },
  next: {
    id: 'pages.ResetPassword.next',
    defaultMessage: 'Next'
  },
  cancel: {
    id: 'pages.ResetPassword.cancel',
    defaultMessage: 'Cancel'
  },
  checkEmail: {
    id: 'pages.ResetPassword.checkEmail',
    defaultMessage: 'We have sent an email to {emailAddress} that contains a link which will allow you to reset your password.<br />Please check your inbox?'
  },
  enterNewPassword: {
    id: 'pages.ResetPassword.enterNewPassword',
    defaultMessage: 'Please enter your new password?'
  },
  newPassword: {
    id: 'pages.ResetPassword.newPassword',
    defaultMessage: 'New Password'
  },
  confirmNewPassword: {
    id: 'pages.ResetPassword.confirmNewPassword',
    defaultMessage: 'Confirm New Password'
  }
})

class ResetPassword extends PureComponent {
  state = {
    submitting: false
  }

  render() {
    const {submitting} = this.state
    const { intl: { formatMessage },
      resetPasswordEnterEmailAddress, resetPasswordEnterPassword, addAcknowledgement } = this.props

    return (
      <div className={styles.Background}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={styles.Content}>
          <div className="pure-g">
            <div className="pure-u-lg-1-3 pure-u-md-1-6 pure-u-sm-1-24">
              &nbsp;
            </div>
            <div className="pure-u-lg-1-3 pure-u-md-2-3 pure-u-sm-11-12">
              <Paper>

                {submitting && <LinearProgress />}
              </Paper>
            </div>
          </div>
        </div>
        <ErrorDisplayContainer />
        <AcknowledgementDisplay />
      </div>
    )
  }
}

function mapStateToProps() {
  return {
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    resetPasswordEnterEmailAddress,
    resetPasswordEnterPassword,
    addAcknowledgement
  }, dispatch)
}

export const ResetPasswordContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResetPassword)
