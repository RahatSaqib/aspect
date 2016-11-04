// Imports from packages
import _ from 'lodash'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { injectIntl, FormattedHTMLMessage } from 'react-intl'
import {Link} from 'react-router'

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

  render() {
    const { intl: { formatMessage }, resetPasswordEnterEmailAddress,
        resetPasswordEnterPassword, addAcknowledgement, addError } = this.props,
      {stepIndex, emailAddress, resetPasswordToken, resettingPassword} = this.state,
      //TODO: Find out what these values should be
      supportTelephone = '+1 (123) 555 5555', supportEmail = 'support@aspect.id',
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
        <Link to="login">
          <FlatButton label={formatMessage(messages.backToLogin)} primary />
        </Link>
      ],
      createResetPasswordToken = formValues => {
        this.setState({
          resettingPassword: true,
          emailAddress: formValues.get('emailAddress')
        })
        return resetPasswordEnterEmailAddress(formValues.get('emailAddress'))
      },
      createResetPasswordTokenFail = () => {
        addError(formatMessage(messages.generateTokenFailedTitle), formatMessage(messages.generateTokenFailed, {supportTelephone: supportTelephone, supportEmail: supportEmail}))
        this.setState({
          resettingPassword: false
        })
      },
      checkInbox = () => {
        this.setState({
          resettingPassword: false,
          stepIndex: 1
        })
        addAcknowledgement(formatMessage(messages.emailSent))
      },
      updatePassword = formValues => {
        this.setState({
          resettingPassword: true
        })
        return resetPasswordEnterPassword(resetPasswordToken, formValues.get('newPassword'))
      },
      updatePasswordFail = () => {
        addError(formatMessage(messages.passwordUpdateFailedTitle), formatMessage(messages.passwordUpdateFailed, {supportTelephone: supportTelephone, supportEmail: supportEmail}))
        this.setState({
          resettingPassword: false
        })
      },
      completeProcess = () => {
        this.setState({
          resettingPassword: false,
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
                  {resettingPassword && <LinearProgress />}
                  {stepIndex === 0 && <ResetPasswordEnterEmail onSubmit={createResetPasswordToken}
                                                               onSubmitSuccess={checkInbox}
                                                               onSubmitFail={createResetPasswordTokenFail}
                                                               showAdminHelpDialog={showAdminHelpDialog} /> }
                  {stepIndex === 1 && <div className={styles.Form}>
                    <FormattedHTMLMessage {...messages.checkEmailContent} values={{ emailAddress: emailAddress }} />
                    <a href="#" onClick={showAdminHelpDialog}>
                      {formatMessage(messages.iDidntReceiveAnEmail)}
                    </a>
                  </div> }
                  {stepIndex === 2 && <div>
                    <ResetPasswordEnterPassword onSubmit={updatePassword}
                                                onSubmitSuccess={completeProcess}
                                                onSubmitFail={updatePasswordFail} />
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
                        <ResetPasswordEnterEmail onSubmit={createResetPasswordToken}
                                                 onSubmitSuccess={checkInbox}
                                                 onSubmitFail={createResetPasswordTokenFail}
                                                 showAdminHelpDialog={showAdminHelpDialog} />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.checkEmail)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <FormattedHTMLMessage {...messages.checkEmailContent} values={{ emailAddress: emailAddress }} />
                          <a href="#" onClick={showAdminHelpDialog}>
                            {formatMessage(messages.iDidntReceiveAnEmail)}
                          </a>
                        </div>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.enterNewPassword)}</StepLabel>
                      <StepContent>
                        <ResetPasswordEnterPassword onSubmit={updatePassword}
                                                    onSubmitSuccess={completeProcess}
                                                    onSubmitFail={updatePasswordFail} />
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>{formatMessage(messages.finish)}</StepLabel>
                      <StepContent>
                        <div className={styles.Form}>
                          <div>
                            <FormattedHTMLMessage {...messages.finishContent} />
                          </div>
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
                onRequestClose={closeAdminHelpDialog}>
          <FormattedHTMLMessage {...messages.adminHelpContent}
                                values={{supportTelephone: supportTelephone, supportEmail: supportEmail}} />
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
