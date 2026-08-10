import React, { useState } from 'react'
import { Box, Button, Paper, Step, StepLabel, Stepper } from '@mui/material'
import { Helmet } from 'react-helmet'
import { FormattedMessage, useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import AspectDialog from '../../../components/shared/AspectDialog'
import config from '../../../config'
import useSendResetPasswordToken from '../../../hooks/auth/useSendResetPasswordToken'
import useUpdatePassword from '../../../hooks/auth/useUpdatePassword'
import messages from './messages'
import styles from './ResetPassword.module.css'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'

const ResetPassword = () => {
  const intl = useIntl()
  const { formatMessage } = intl
  const { search } = useLocation()
  const resetPasswordToken = new URLSearchParams(search).get('token')
  const { mutateAsync: sendResetPasswordToken } = useSendResetPasswordToken()
  const { mutateAsync: updateUserPassword } = useUpdatePassword()

  const [emailAddress, setEmailAddress] = useState('')
  const [stepIndex, setStepIndex] = useState(resetPasswordToken ? 2 : 0)
  const [showAdminHelpDialog, setShowAdminHelpDialog] = useState(false)

  const openAdminHelpDialog = event => {
    event.preventDefault()
    setShowAdminHelpDialog(true)
  }

  const closeAdminHelpDialog = () => setShowAdminHelpDialog(false)

  const createResetPasswordToken = async ({ emailAddress: enteredEmailAddress }) => {
    setEmailAddress(enteredEmailAddress)

    try {
      await sendResetPasswordToken(enteredEmailAddress)
      setStepIndex(1)
    } catch (error) {
      toast.error(
        <>
          <strong>{formatMessage(messages.generateTokenFailedTitle)}</strong>
          <p>{formatMessage(messages.generateTokenFailedMessage)}</p>
          <p>{formatMessage(messages.generateTokenFailedResolution, { supportEmail: config.supportEmail })}</p>
        </>
      )
    }
  }

  const updatePassword = async ({ newPassword }) => {
    try {
      await updateUserPassword({ resetPasswordToken, newPassword })
      setStepIndex(3)
    } catch (error) {
      toast.error(
        <>
          <strong>{formatMessage(messages.passwordUpdateFailedTitle)}</strong>
          <p>{formatMessage(messages.passwordUpdateFailedMessage)}</p>
          <p>{formatMessage(messages.passwordUpdateFailedResolution, { supportEmail: config.supportEmail })}</p>
        </>
      )
    }
  }

  const adminHelpDialogActions = [
    <Button key="close" color="secondary" onClick={closeAdminHelpDialog}>
      {formatMessage(messages.adminHelpClose)}
    </Button>,
    <Link key="backToLogin" to="/login">
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
                {stepIndex === 0 && (
                  <ResetPasswordEnterEmail
                    intl={intl}
                    action={
                      <Link to="/login">
                        <Button>{formatMessage(messages.cancel)}</Button>
                      </Link>
                    }
                    onSubmit={createResetPasswordToken}
                    onShowAdminHelpDialog={openAdminHelpDialog}
                  />
                )}
                {stepIndex === 1 && (
                  <div className={styles.Form}>
                    <FormattedMessage {...messages.checkEmailContent} values={{ emailAddress }} />
                    <a href="#showAdminHelp" onClick={openAdminHelpDialog}>
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
                          <Button>{formatMessage(messages.cancel)}</Button>
                        </Link>
                      }
                      onSubmit={updatePassword}
                    />
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
        open={showAdminHelpDialog}
        onRequestClose={closeAdminHelpDialog}
      >
        <FormattedMessage {...messages.adminHelpContent} values={{ supportEmail: config.supportEmail }} />
      </AspectDialog>
    </div>
  )
}

export default ResetPassword
