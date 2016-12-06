// Imports from packages
import _ from 'lodash'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { injectIntl, FormattedHTMLMessage } from 'react-intl'
import { Link } from 'react-router'

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
import config from '../../config'
import { Unit, Hidden } from '../../components/pureGrids'
import {
  resetPasswordEnterEmailAddress,
  resetPasswordEnterPassword
} from '../AuthRedux'
import { showError, showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import styles from './ResetPassword.css'
import messages from './messages'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'
import AppNotificationSnackBar from '../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../appNotification/AppNotificationDialog'

export class ResetPassword extends PureComponent {
  state = {
    emailAddress: '',
    resetPasswordToken: '',
    stepIndex: 0,
    showAdminHelpDialog: false,
    resettingPassword: false
  }

  componentDidMount() {
    const { location: { query: { token } } } = this.props

    /* eslint-disable react/no-did-mount-set-state */
    this.setState({
      resetPasswordToken: token
    }, () => {
      if (token) {
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

  createResetPasswordToken = (formValues) => {
    const { resetPasswordEnterEmailAddress } = this.props
    this.setState({
      resettingPassword: true,
      emailAddress: formValues.get('emailAddress')
    })
    return resetPasswordEnterEmailAddress(formValues.get('emailAddress'))
  }

  createResetPasswordTokenFail = () => {
    this.props.showError({
      severity: 'warn',
      title: messages.generateTokenFailedTitle,
      message: messages.generateTokenFailedMessage,
      resolution: messages.generateTokenFailedResolution,
      messageValues: {
        supportTelephone: config.supportTelephone,
        supportEmail: config.supportEmail
      }
    })
    this.setState({
      resettingPassword: false
    })
  }

  checkInbox = () => {
    this.setState({
      resettingPassword: false,
      stepIndex: 1
    })
    this.props.showAcknowledgement({
      title: messages.emailSent,
      message: messages.checkEmailContent,
      messageValues: {
        emailAddress: this.state.emailAddress
      }
    })
  }

  updatePassword = (formValues) => {
    const { resetPasswordEnterPassword } = this.props
    const { resetPasswordToken } = this.state
    this.setState({
      resettingPassword: true
    })
    return resetPasswordEnterPassword(resetPasswordToken, formValues.get('newPassword'))
  }

  updatePasswordFail = () => {
    this.props.showError({
      severity: 'warn',
      title: messages.passwordUpdateFailedTitle,
      message: messages.passwordUpdateFailedMessage,
      resolution: messages.passwordUpdateFailedResolution,
      messageValues: {
        supportTelephone: config.supportTelephone,
        supportEmail: config.supportEmail
      }
    })
    this.setState({
      resettingPassword: false
    })
  }

  completeProcess = () => {
    this.setState({
      resettingPassword: false,
      stepIndex: 3
    })
    this.props.showAcknowledgement({
      title: messages.passwordUpdatedTitle,
      message: messages.passwordUpdatedMessage
    })
  }

  render() {
    const { intl: { formatMessage } } = this.props
    const { stepIndex, emailAddress, resettingPassword } = this.state
    const adminHelpDialogActions = [
      <FlatButton
        label={formatMessage(messages.adminHelpClose)}
        secondary
        onTouchTap={this.closeAdminHelpDialog}
      />,
      <Link to="login">
        <FlatButton label={formatMessage(messages.backToLogin)} primary />
      </Link>
    ]

    return (
      <div className={styles.Background}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={styles.Content}>
          <div>
            <Unit xs="1-24" md="1-12" xl="1-4" />
            <Unit xs="11-12" md="5-6" xl="1-2">
              <Paper>
                <Hidden xs sm className={styles.LargeConten}>
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
                  {stepIndex === 0 && <ResetPasswordEnterEmail
                    onSubmit={this.createResetPasswordToken}
                    onSubmitSuccess={this.checkInbox}
                    onSubmitFail={this.createResetPasswordTokenFail}
                    showAdminHelpDialog={this.showAdminHelpDialog}
                  /> }
                  {stepIndex === 1 && <div className={styles.Form}>
                    <FormattedHTMLMessage
                      {...messages.checkEmailContent}
                      values={{ emailAddress }}
                    />
                    <a href="#showAdminHelp" onClick={this.showAdminHelpDialog}>
                      {formatMessage(messages.iDidntReceiveAnEmail)}
                    </a>
                  </div> }
                  {stepIndex === 2 && <div>
                    <ResetPasswordEnterPassword
                      onSubmit={this.updatePassword}
                      onSubmitSuccess={this.completeProcess}
                      onSubmitFail={this.updatePasswordFail}
                    />
                    <br />
                    <br />
                    <br />
                    <br />
                  </div>}
                  {stepIndex === 3 && <div className={styles.Form}>
                    <FormattedHTMLMessage {...messages.finishContent} />
                    <div className={styles.Form__ActionRow}>
                      <Link to="login">
                        <FlatButton
                          primary
                          label={formatMessage(messages.loginWithMyNewPassword)}
                        />
                      </Link>
                    </div>
                  </div> }
                </Hidden>
                <Hidden md lg xl>
                  {resettingPassword && <LinearProgress />}
                  <Stepper activeStep={stepIndex} orientation="vertical">
                    <Step>
                      <StepLabel>{formatMessage(messages.enterEmailAddress)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterEmail
                          onSubmit={this.createResetPasswordToken}
                          onSubmitSuccess={this.checkInbox}
                          onSubmitFail={this.createResetPasswordTokenFail}
                          showAdminHelpDialog={this.showAdminHelpDialog}
                        />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.checkEmail)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage
                            {...messages.checkEmailContent}
                            values={{ emailAddress }}
                          />
                          <a href="#showAdminHelp" onClick={this.showAdminHelpDialog}>
                            {formatMessage(messages.iDidntReceiveAnEmail)}
                          </a>
                        </div>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.enterNewPassword)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterPassword
                          onSubmit={this.updatePassword}
                          onSubmitSuccess={this.completeProcess}
                          onSubmitFail={this.updatePasswordFail}
                        />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.finish)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage {...messages.finishContent} />
                          <div className={styles.Form__ActionRow}>
                            <Link to="login">
                              <FlatButton
                                primary
                                label={formatMessage(messages.loginWithMyNewPassword)}
                              />
                            </Link>
                          </div>
                        </div>
                      </StepContent>
                    </Step>
                  </Stepper>
                </Hidden>
              </Paper>
            </Unit>
          </div>
        </div>
        <AppNotificationDialog />
        <AppNotificationSnackBar />
        <Dialog
          title={formatMessage(messages.adminHelpHeader)}
          actions={adminHelpDialogActions} modal={false}
          open={this.state.showAdminHelpDialog}
          onRequestClose={this.closeAdminHelpDialog}
        >
          <FormattedHTMLMessage
            {...messages.adminHelpContent}
            values={{
              supportTelephone: config.supportTelephone,
              supportEmail: config.supportEmail }}
          />
        </Dialog>
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
    showError,
    showAcknowledgement
  }, dispatch)
}

export const ResetPasswordContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResetPassword)
