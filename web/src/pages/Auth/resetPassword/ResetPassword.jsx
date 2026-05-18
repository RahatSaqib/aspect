import React, { PureComponent } from 'react'
import { Box, Button, LinearProgress, Paper, Step, StepLabel, Stepper } from '@mui/material'
import { Helmet } from 'react-helmet'
import { FormattedMessage, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { compose, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import config from '../../../config'
import AspectDialog from '../../../components/shared/AspectDialog'
import { showError, showAcknowledgement } from '../../../store/AppNotificationRedux'
import { resetPasswordEnterEmailAddress, resetPasswordEnterPassword } from '../../../store/AuthRedux'
import messages from './messages'
import styles from './ResetPassword.module.css'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'

const enhance = compose(
  injectIntl,
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

class ResetPassword extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      emailAddress: '',
      resetPasswordToken: '',
      stepIndex: 0,
      showAdminHelpDialog: false,
      resettingPassword: false,
    }
  }

  componentDidMount() {
    const token = this.props.searchParams.get('token')

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
    return resetPasswordEnterEmailAddress(emailAddress).then(this.checkInbox, this.createResetPasswordTokenFail)
  }

  createResetPasswordTokenFail = () => {
    this.props.showError({
      severity: 'warn',
      title: messages.generateTokenFailedTitle,
      message: messages.generateTokenFailedMessage,
      resolution: messages.generateTokenFailedResolution,
      messageValues: {
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
    const {
      intl: { formatMessage },
    } = this.props
    const { stepIndex, emailAddress, resettingPassword } = this.state
    const adminHelpDialogActions = [
      <Button color="secondary" onClick={this.closeAdminHelpDialog}>
        {formatMessage(messages.adminHelpClose)}
      </Button>,
      <Link to="/login">
        <Button color="primary">{formatMessage(messages.backToLogin)}</Button>
      </Link>,
    ]

    return (
      <div className={styles.Background}>
        <Helmet title={formatMessage(messages.title)} />
        <div className={styles.Content}>
          <div>
            <Box sx={{ margin: '0 auto', width: { xs: '90%', md: '80%', xl: '50%' } }}>
              <Paper>
                <Box
                  component="div"
                  sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}
                  className={styles.LargeConten}
                >
                  <Stepper activeStep={stepIndex} orientation="horizontal" style={{ padding: 24 }}>
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
                  {stepIndex === 0 && (
                    <ResetPasswordEnterEmail
                      intl={intl}
                      action={
                        <Link to="/login">
                          <Button>{intl.formatMessage(messages.cancel)}</Button>
                        </Link>
                      }
                      onSubmit={this.createResetPasswordToken}
                      onShowAdminHelpDialog={this.showAdminHelpDialog}
                    />
                  )}
                  {stepIndex === 1 && (
                    <div className={styles.Form}>
                      <FormattedMessage {...messages.checkEmailContent} values={{ emailAddress }} />
                      <a href="#showAdminHelp" onClick={this.showAdminHelpDialog}>
                        {formatMessage(messages.iDidntReceiveAnEmail)}
                      </a>
                    </div>
                  )}
                  {stepIndex === 2 && (
                    <div>
                      <ResetPasswordEnterPassword
                        intl={intl}
                        action={
                          <Link to="/login">
                            <Button>{intl.formatMessage(messages.cancel)}</Button>
                          </Link>
                        }
                        onSubmit={this.updatePassword}
                      />
                      <br />
                      <br />
                      <br />
                      <br />
                    </div>
                  )}
                  {stepIndex === 3 && (
                    <div className={styles.Form}>
                      <FormattedMessage {...messages.finishContent} />
                      <div className={styles.Form__ActionRow}>
                        <Link to="/login">
                          <Button color="primary">{formatMessage(messages.loginWithMyNewPassword)}</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Box>
              </Paper>
            </Box>
          </div>
        </div>
        <AspectDialog
          title={formatMessage(messages.adminHelpHeader)}
          actions={adminHelpDialogActions}
          modal={false}
          open={this.state.showAdminHelpDialog}
          onRequestClose={this.closeAdminHelpDialog}
        >
          <FormattedMessage {...messages.adminHelpContent} values={{ supportEmail: config.supportEmail }} />
        </AspectDialog>
      </div>
    )
  }
}

export default enhance(ResetPassword)
