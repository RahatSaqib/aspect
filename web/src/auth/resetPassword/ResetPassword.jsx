// Imports from packages
import _ from 'lodash'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { injectIntl, FormattedHTMLMessage } from 'react-intl'

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
  resetPasswordSetToken,
  resetPasswordEnterPassword
} from '../AuthRedux'
import { addAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'
import styles from './ResetPassword.css'
import messages from './messages'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'

class ResetPassword extends PureComponent {
  state = {
    emailAddress: '',
    stepIndex: 0,
    showAdminHelpDialog: false
  }

  componentDidMount() {
    const { location: { query: { token } },
      resetPasswordSetToken} = this.props
    resetPasswordSetToken(token)
    if(token) {
      this.setState({
        stepIndex: 2
      })
    }
  }

  render() {
    const { intl: { formatMessage }, user,
      resetPasswordEnterEmailAddress, resetPasswordEnterPassword,
      addAcknowledgement, resetPasswordSetToken } = this.props,
      {stepIndex, emailAddress} = this.state,
      showAdminHelpDialog = () => {
        this.setState({
          showAdminHelpDialog: true
        })
      },
      closeAdminHelpDialog = () => {
        this.setState({
          showAdminHelpDialog: false
        })
      },
      adminHelpDialogActions = [
        <FlatButton label={formatMessage(messages.adminHelpClose)} secondary onTouchTap={closeAdminHelpDialog} />,
        <FlatButton label={formatMessage(messages.backToLogin)} primary href="/login" />
      ],
      createResetPasswordToken = formValues => {
        this.setState({
          emailAddress: formValues.get('emailAddress')
        })
        resetPasswordEnterEmailAddress(formValues.get('emailAddress'))
      },
      checkInbox = () => {
        this.setState({
          stepIndex: 1
        })
        addAcknowledgement(formatMessage(messages.emailSent))
      },
      updatePassword = formValues => {
        resetPasswordEnterPassword(user.resetPasswordToken, formValues.get('newPassword'))
        resetPasswordSetToken('')
      },
      completeProcess = () => {
        this.setState({
          stepIndex: 3
        })
        addAcknowledgement(formatMessage(messages.passwordUpdated))
      }

    return (
      <div className={styles.Background}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={styles.Content}>
          <div className="pure-g">
            <div className="pure-u-1-24 pure-u-md-1-12 pure-u-xl-1-4"></div>
            <div className="pure-u-11-12 pure-u-md-5-6 pure-u-xl-1-2">
              <Paper>
                <div className={'pure-hidden-xs pure-hidden-sm ' + styles.LargeContent}>
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
                  {stepIndex === 0 && <ResetPasswordEnterEmail onSubmit={createResetPasswordToken}
                                                               onSubmitSuccess={checkInbox}
                                                               showAdminHelpDialog={showAdminHelpDialog} /> }
                  {stepIndex === 1 && <div className={styles.Form}>
                    <FormattedHTMLMessage {...messages.checkEmailContent} values={{ emailAddress: emailAddress }} />
                    <FlatButton secondary label={formatMessage(messages.iDidntReceiveAnEmail)} onTouchTap={showAdminHelpDialog} />
                  </div> }
                  {stepIndex === 2 && <div>
                    <ResetPasswordEnterPassword onSubmit={updatePassword} onSubmitSuccess={completeProcess} />
                    <br />
                    <br />
                    <br />
                    <br />
                  </div>}
                  {stepIndex === 3 && <div className={styles.Form}>
                    <FormattedHTMLMessage {...messages.finishContent} values={{ username: user.usernameReminder }} />
                    <div className={styles.Form__ActionRow}>
                      <FlatButton primary href="/login" label={formatMessage(messages.loginWithMyNewPassword)} />
                    </div>
                  </div> }
                </div>
                <div className="pure-hidden-md pure-hidden-lg pure-hidden-xl">
                  <Stepper activeStep={stepIndex} orientation="vertical">
                    <Step>
                      <StepLabel>{formatMessage(messages.enterEmailAddress)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterEmail onSubmit={createResetPasswordToken}
                                                 onSubmitSuccess={checkInbox}
                                                 showAdminHelpDialog={showAdminHelpDialog} />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.checkEmail)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage {...messages.checkEmailContent} values={{ emailAddress: emailAddress }} />
                          <FlatButton secondary label={formatMessage(messages.iDidntReceiveAnEmail)} onTouchTap={showAdminHelpDialog} />
                        </div>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.enterNewPassword)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterPassword onSubmit={updatePassword}
                                                    onSubmitSuccess={completeProcess} />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.finish)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <div>
                            <FormattedHTMLMessage {...messages.finishContent} values={{ username: user.usernameReminder }} />
                          </div>
                          <div className={styles.Form__ActionRow}>
                            <FlatButton primary href="/login" label={formatMessage(messages.loginWithMyNewPassword)} />
                          </div>
                        </div>
                      </StepContent>
                    </Step>
                  </Stepper>
                </div>
                {user.resettingPassword && <LinearProgress />}
              </Paper>
            </div>
          </div>
        </div>
        <Dialog title={formatMessage(messages.adminHelpHeader)}
                actions={adminHelpDialogActions} modal={false}
                open={this.state.showAdminHelpDialog}
                onRequestClose={closeAdminHelpDialog}>
          <FormattedHTMLMessage {...messages.adminHelpContent} />
        </Dialog>
        <ErrorDisplayContainer />
        <AcknowledgementDisplay />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    user: state.user
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    resetPasswordEnterEmailAddress,
    resetPasswordSetToken,
    resetPasswordEnterPassword,
    addAcknowledgement
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResetPassword)
