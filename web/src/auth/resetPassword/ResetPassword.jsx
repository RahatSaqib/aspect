import React, { PureComponent } from 'react'
import { compose, withProps, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { FormattedHTMLMessage } from 'react-intl'
import { Button } from 'react-toolbox/lib/button'
import { Link } from 'react-router-dom'

// Material-UI
import Paper from 'material-ui/Paper'
import { Step, Stepper, StepLabel, StepContent } from 'material-ui/Stepper'
import FlatButton from 'material-ui/FlatButton'
import LinearProgress from 'material-ui/LinearProgress'
import Dialog from 'material-ui/Dialog'

// Our own imports
import config from '../../config'
import { Unit, Hidden } from '../../components/pureGrids'
import {
  resetPasswordEnterEmailAddress,
  resetPasswordEnterPassword,
} from '../AuthRedux'
import {
  showError,
  showAcknowledgement,
} from '../../appNotification/AppNotificationRedux'
import styles from './ResetPassword.css'
import messages from './messages'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'

const enhance = compose(
  pure,
  withProps(({ location }) => ({
    searchParams: new URLSearchParams(location.search),
  })),
  connect(
    null,
    bindActionCreators.bind(null, {
      resetPasswordEnterEmailAddress,
      resetPasswordEnterPassword,
      showError,
      showAcknowledgement,
    })
  )
)

export class ResetPassword extends PureComponent {
  state = {
    emailAddress: '',
    resetPasswordToken: '',
    stepIndex: 0,
    showAdminHelpDialog: false,
    resettingPassword: false,
  }

  componentDidMount() {
    const token = this.props.searchParams.get('token')

    /* eslint-disable react/no-did-mount-set-state */
    this.setState(
      {
        resetPasswordToken: token,
      },
      () => {
        if (token) {
          this.setState({
            stepIndex: 2,
          })
        }
      }
    )
  }

  showAdminHelpDialog = event => {
    event.preventDefault()
    this.setState({
      showAdminHelpDialog: true,
    })
  }

  closeAdminHelpDialog = () => {
    this.setState({
      showAdminHelpDialog: false,
    })
  }

  createResetPasswordToken = ({ emailAddress }) => {
    const { resetPasswordEnterEmailAddress } = this.props
    this.setState({
      resettingPassword: true,
      emailAddress,
    })
    return resetPasswordEnterEmailAddress(emailAddress).then(
      this.checkInbox,
      this.createResetPasswordTokenFail
    )
  }

  createResetPasswordTokenFail = () => {
    this.props.showError({
      severity: 'warn',
      title: messages.generateTokenFailedTitle,
      message: messages.generateTokenFailedMessage,
      resolution: messages.generateTokenFailedResolution,
      messageValues: {
        supportTelephone: config.supportTelephone,
        supportEmail: config.supportEmail,
      },
    })
    this.setState({
      resettingPassword: false,
    })
  }

  checkInbox = () => {
    this.setState({
      resettingPassword: false,
      stepIndex: 1,
    })
    this.props.showAcknowledgement({
      title: messages.emailSent,
      message: messages.checkEmailContent,
      messageValues: {
        emailAddress: this.state.emailAddress,
      },
    })
  }

  updatePassword = ({ newPassword }) => {
    const { resetPasswordEnterPassword } = this.props
    const { resetPasswordToken } = this.state
    this.setState({
      resettingPassword: true,
    })
    return resetPasswordEnterPassword(resetPasswordToken, newPassword).then(
      this.completeProcess,
      this.updatePasswordFail
    )
  }

  updatePasswordFail = () => {
    this.props.showError({
      severity: 'warn',
      title: messages.passwordUpdateFailedTitle,
      message: messages.passwordUpdateFailedMessage,
      resolution: messages.passwordUpdateFailedResolution,
      messageValues: {
        supportTelephone: config.supportTelephone,
        supportEmail: config.supportEmail,
      },
    })
    this.setState({
      resettingPassword: false,
    })
  }

  completeProcess = () => {
    this.setState({
      resettingPassword: false,
      stepIndex: 3,
    })
    this.props.showAcknowledgement({
      title: messages.passwordUpdatedTitle,
      message: messages.passwordUpdatedMessage,
    })
  }

  render() {
    const { intl } = this.props
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
      </Link>,
    ]

    return (
      <div className={styles.Background}>
        <Helmet title={formatMessage(messages.title)} />
        <div className={styles.Content}>
          <div>
            <Unit xs="1-24" md="1-12" xl="1-4" />
            <Unit xs="11-12" md="5-6" xl="1-2">
              <Paper>
                <Hidden xs sm className={styles.LargeConten}>
                  <Stepper activeStep={stepIndex}>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.enterEmailAddress)}
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.checkEmail)}
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.enterNewPassword)}
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.finish)}
                      </StepLabel>
                    </Step>
                  </Stepper>
                  {resettingPassword && <LinearProgress />}
                  {stepIndex === 0 &&
                    <ResetPasswordEnterEmail
                      intl={intl}
                      action={
                        <Link to="/login">
                          <Button
                            neutral
                            flat
                            label={intl.formatMessage(messages.cancel)}
                          />
                        </Link>
                      }
                      onSubmit={this.createResetPasswordToken}
                      onShowAdminHelpDialog={this.showAdminHelpDialog}
                    />}
                  {stepIndex === 1 &&
                    <div className={styles.Form}>
                      <FormattedHTMLMessage
                        {...messages.checkEmailContent}
                        values={{ emailAddress }}
                      />
                      <a
                        href="#showAdminHelp"
                        onClick={this.showAdminHelpDialog}
                      >
                        {formatMessage(messages.iDidntReceiveAnEmail)}
                      </a>
                    </div>}
                  {stepIndex === 2 &&
                    <div>
                      <ResetPasswordEnterPassword
                        intl={intl}
                        action={
                          <Link to="/login">
                            <Button
                              neutral
                              flat
                              label={intl.formatMessage(messages.cancel)}
                            />
                          </Link>
                        }
                        onSubmit={this.updatePassword}
                      />
                      <br />
                      <br />
                      <br />
                      <br />
                    </div>}
                  {stepIndex === 3 &&
                    <div className={styles.Form}>
                      <FormattedHTMLMessage {...messages.finishContent} />
                      <div className={styles.Form__ActionRow}>
                        <Link to="login">
                          <FlatButton
                            primary
                            label={formatMessage(
                              messages.loginWithMyNewPassword
                            )}
                          />
                        </Link>
                      </div>
                    </div>}
                </Hidden>
                <Hidden md lg xl>
                  {resettingPassword && <LinearProgress />}
                  <Stepper activeStep={stepIndex} orientation="vertical">
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.enterEmailAddress)}
                      </StepLabel>
                      <StepContent>
                        <ResetPasswordEnterEmail
                          intl={intl}
                          action={
                            <Link to="/login">
                              <Button
                                neutral
                                flat
                                label={intl.formatMessage(messages.cancel)}
                              />
                            </Link>
                          }
                          onSubmit={this.createResetPasswordToken}
                          onShowAdminHelpDialog={this.showAdminHelpDialog}
                        />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.checkEmail)}
                      </StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage
                            {...messages.checkEmailContent}
                            values={{ emailAddress }}
                          />
                          <a
                            href="#showAdminHelp"
                            onClick={this.showAdminHelpDialog}
                          >
                            {formatMessage(messages.iDidntReceiveAnEmail)}
                          </a>
                        </div>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.enterNewPassword)}
                      </StepLabel>
                      <StepContent>
                        <ResetPasswordEnterPassword
                          intl={intl}
                          action={
                            <Link to="/login">
                              <Button
                                neutral
                                flat
                                label={intl.formatMessage(messages.cancel)}
                              />
                            </Link>
                          }
                          onSubmit={this.updatePassword}
                        />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>
                        {formatMessage(messages.finish)}
                      </StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage {...messages.finishContent} />
                          <div className={styles.Form__ActionRow}>
                            <Link to="login">
                              <FlatButton
                                primary
                                label={formatMessage(
                                  messages.loginWithMyNewPassword
                                )}
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
        <Dialog
          title={formatMessage(messages.adminHelpHeader)}
          actions={adminHelpDialogActions}
          modal={false}
          open={this.state.showAdminHelpDialog}
          onRequestClose={this.closeAdminHelpDialog}
        >
          <FormattedHTMLMessage
            {...messages.adminHelpContent}
            values={{
              supportTelephone: config.supportTelephone,
              supportEmail: config.supportEmail,
            }}
          />
        </Dialog>
      </div>
    )
  }
}

export default enhance(ResetPassword)
