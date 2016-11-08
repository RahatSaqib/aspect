// Imports from packages
import _ from 'lodash'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { injectIntl, FormattedHTMLMessage } from 'react-intl'
import {Link} from 'react-router'
import classNames from 'classnames'

// Material-UI
import Paper from 'material-ui/Paper'
import {
  Step,
  Stepper,
  StepLabel,
  StepContent
} from 'material-ui/Stepper'
import FlatButton from 'material-ui/FlatButton'
import LinearProgress from 'material-ui/LinearProgress'
import Dialog from 'material-ui/Dialog'

// Our own imports
import { ErrorDisplayContainer } from '../../components/shared/ErrorDisplay'
import AcknowledgementDisplay from '../../components/shared/AcknowledgementDisplay'
import {
  resetPasswordEnterEmailAddress,
  resetPasswordEnterPassword
} from '../AuthRedux'
import { addAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'
import { addError } from '../../error/ErrorRedux'
import styles from './ResetPassword.css'
import messages from './messages'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'
import config from 'config'

class ResetPassword extends PureComponent {
  state = {
    emailAddress: '',
    resetPasswordToken: '',
    stepIndex: 0,
    showAdminHelpDialog: false,
    resettingPassword: false
  }

  componentDidMount() {
    const { location: { query: { token } } } = this.props
    this.setState({
      resetPasswordToken: token
    }, () => {
      if(token) {
        this.setState({
          stepIndex: 2
        })
      }
    })
  }

  showAdminHelpDialog = () => {
    this.setState({
      showAdminHelpDialog: true
    })
  }

  closeAdminHelpDialog = () => {
    this.setState({
      showAdminHelpDialog: false
    })
  }

  createResetPasswordToken = formValues => {
    const { resetPasswordEnterEmailAddress } = this.props
    this.setState({
      resettingPassword: true,
      emailAddress: formValues.get('emailAddress')
    })
    return resetPasswordEnterEmailAddress(formValues.get('emailAddress'))
  }

  createResetPasswordTokenFail = () => {
    const { intl: { formatMessage }, addError } = this.props
    addError(formatMessage(messages.generateTokenFailedTitle), formatMessage(messages.generateTokenFailed, {supportTelephone: config.supportTelephone, supportEmail: config.supportEmail}))
    this.setState({
      resettingPassword: false
    })
  }

  checkInbox = () => {
    const { intl: { formatMessage }, addAcknowledgement } = this.props
    this.setState({
      resettingPassword: false,
      stepIndex: 1
    })
    addAcknowledgement(formatMessage(messages.emailSent))
  }

  updatePassword = formValues => {
    const { resetPasswordEnterPassword } = this.props,
      {resetPasswordToken} = this.state
    this.setState({
      resettingPassword: true
    })
    return resetPasswordEnterPassword(resetPasswordToken, formValues.get('newPassword'))
  }

  updatePasswordFail = () => {
    const { intl: { formatMessage }, addError } = this.props
    addError(formatMessage(messages.passwordUpdateFailedTitle), formatMessage(messages.passwordUpdateFailed, {supportTelephone: config.supportTelephone, supportEmail: config.supportEmail}))
    this.setState({
      resettingPassword: false
    })
  }

  completeProcess = () => {
    const { intl: { formatMessage }, addAcknowledgement } = this.props
    this.setState({
      resettingPassword: false,
      stepIndex: 3
    })
    addAcknowledgement(formatMessage(messages.passwordUpdated))
  }

  render() {
    const { intl: { formatMessage } } = this.props,
      {stepIndex, emailAddress, resettingPassword} = this.state,
      adminHelpDialogActions = [
        <FlatButton label={formatMessage(messages.adminHelpClose)} secondary onTouchTap={this.closeAdminHelpDialog} />,
        <Link to="login">
          <FlatButton label={formatMessage(messages.backToLogin)} primary />
        </Link>
      ]

    return (
      <div className={styles.Background}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={styles.Content}>
          <div className="pure-g">
            <div className="pure-u-1-24 pure-u-md-1-12 pure-u-xl-1-4"></div>
            <div className="pure-u-11-12 pure-u-md-5-6 pure-u-xl-1-2">
              <Paper>
                <div className={classNames('pure-hidden-xs', 'pure-hidden-sm', styles.LargeContent)}>
                  <Stepper activeStep={stepIndex}>
                    <Step>
                      <StepLabel>{formatMessage(messages.enterEmailAddress)}</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.checkEmail)}</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.enterNewPassword)}</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.finish)}</StepLabel>
                    </Step>
                  </Stepper>
                  {resettingPassword && <LinearProgress />}
                  {stepIndex === 0 && <ResetPasswordEnterEmail onSubmit={this.createResetPasswordToken}
                                                               onSubmitSuccess={this.checkInbox}
                                                               onSubmitFail={this.createResetPasswordTokenFail}
                                                               showAdminHelpDialog={this.showAdminHelpDialog} /> }
                  {stepIndex === 1 && <div className={styles.Form}>
                    <FormattedHTMLMessage {...messages.checkEmailContent} values={{ emailAddress: emailAddress }} />
                    <a href="#" onClick={this.showAdminHelpDialog}>
                      {formatMessage(messages.iDidntReceiveAnEmail)}
                    </a>
                  </div> }
                  {stepIndex === 2 && <div>
                    <ResetPasswordEnterPassword onSubmit={this.updatePassword}
                                                onSubmitSuccess={this.completeProcess}
                                                onSubmitFail={this.updatePasswordFail} />
                    <br />
                    <br />
                    <br />
                    <br />
                  </div>}
                  {stepIndex === 3 && <div className={styles.Form}>
                    <FormattedHTMLMessage {...messages.finishContent} />
                    <div className={styles.Form__ActionRow}>
                      <Link to="login">
                        <FlatButton primary label={formatMessage(messages.loginWithMyNewPassword)} />
                      </Link>
                    </div>
                  </div> }
                </div>
                <div className="pure-hidden-md pure-hidden-lg pure-hidden-xl">
                  {resettingPassword && <LinearProgress />}
                  <Stepper activeStep={stepIndex} orientation="vertical">
                    <Step>
                      <StepLabel>{formatMessage(messages.enterEmailAddress)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterEmail onSubmit={this.createResetPasswordToken}
                                                 onSubmitSuccess={this.checkInbox}
                                                 onSubmitFail={this.createResetPasswordTokenFail}
                                                 showAdminHelpDialog={this.showAdminHelpDialog} />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.checkEmail)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage {...messages.checkEmailContent} values={{ emailAddress: emailAddress }} />
                          <a href="#" onClick={this.showAdminHelpDialog}>
                            {formatMessage(messages.iDidntReceiveAnEmail)}
                          </a>
                        </div>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.enterNewPassword)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterPassword onSubmit={this.updatePassword}
                                                    onSubmitSuccess={this.completeProcess}
                                                    onSubmitFail={this.updatePasswordFail} />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.finish)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage {...messages.finishContent} />
                          <div className={styles.Form__ActionRow}>
                            <Link to="login">
                              <FlatButton primary label={formatMessage(messages.loginWithMyNewPassword)} />
                            </Link>
                          </div>
                        </div>
                      </StepContent>
                    </Step>
                  </Stepper>
                </div>
              </Paper>
            </div>
          </div>
        </div>
        <Dialog title={formatMessage(messages.adminHelpHeader)}
                actions={adminHelpDialogActions} modal={false}
                open={this.state.showAdminHelpDialog}
                onRequestClose={this.closeAdminHelpDialog}>
          <FormattedHTMLMessage {...messages.adminHelpContent}
                                values={{supportTelephone: config.supportTelephone, supportEmail: config.supportEmail}} />
        </Dialog>
        <ErrorDisplayContainer />
        <AcknowledgementDisplay />
      </div>
    )
  }
}

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    resetPasswordEnterEmailAddress,
    resetPasswordEnterPassword,
    addAcknowledgement,
    addError
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResetPassword)
