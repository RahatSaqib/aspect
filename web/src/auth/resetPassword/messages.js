import { defineMessages } from 'react-intl'

export default defineMessages({
  title: {
    id: 'pages.ResetPassword.title',
    defaultMessage: 'Reset Password'
  },
  enterEmailAddress: {
    id: 'pages.ResetPassword.enterEmailAddress',
    defaultMessage: 'Enter Email Address'
  },
  enterEmailAddressContent: {
    id: 'pages.ResetPassword.enterEmailAddressContent',
    defaultMessage: 'Please enter the email address that you are registered with'
  },
  emailAddress: {
    id: 'pages.ResetPassword.emailAddress',
    defaultMessage: 'Email Address'
  },
  invalidEmailAddress: {
    id: 'pages.ResetPassword.invalidEmailAddress',
    defaultMessage: 'Please enter a valid email address'
  },
  next: {
    id: 'pages.ResetPassword.next',
    defaultMessage: 'Next'
  },
  cancel: {
    id: 'pages.ResetPassword.cancel',
    defaultMessage: 'Cancel'
  },
  emailSent: {
    id: 'pages.ResetPassword.emailSent',
    defaultMessage: 'An email has been sent to you'
  },
  checkEmail: {
    id: 'pages.ResetPassword.checkEmail',
    defaultMessage: 'Check Inbox'
  },
  checkEmailContent: {
    id: 'pages.ResetPassword.checkEmailContent',
    defaultMessage: '<p>We have sent an email to {emailAddress} that contains a link which will allow you to reset your password.</p><p>Please check your inbox?</p>'
  },
  enterNewPassword: {
    id: 'pages.ResetPassword.enterNewPassword',
    defaultMessage: 'Enter New Password'
  },
  enterNewPasswordContent: {
    id: 'pages.ResetPassword.enterNewPasswordContent',
    defaultMessage: 'Please enter your new password?'
  },
  newPassword: {
    id: 'pages.ResetPassword.newPassword',
    defaultMessage: 'New Password'
  },
  newPasswordTooShort: {
    id: 'pages.ResetPassword.newPasswordTooShort',
    defaultMessage: 'Your password needs to be at least 8 characters long'
  },
  newPasswordMustContainANumber: {
    id: 'pages.ResetPassword.newPasswordMustContainANumber',
    defaultMessage: 'Your password needs to contain at least one number'
  },
  newPasswordMustContainASpecialCharacter: {
    id: 'pages.ResetPassword.newPasswordMustContainASpecialCharacter',
    defaultMessage: 'Your password needs to contain a special character (%!$*...)'
  },
  confirmNewPassword: {
    id: 'pages.ResetPassword.confirmNewPassword',
    defaultMessage: 'Confirm New Password'
  },
  passwordsDoNotMatch: {
    id: 'pages.ResetPassword.passwordsDoNotMatch',
    defaultMessage: 'These passwords don\'t match'
  },
  passwordUpdated: {
    id: 'pages.ResetPassword.passwordUpdated',
    defaultMessage: 'Your password has been changed successfully'
  },
  finish: {
    id: 'pages.ResetPassword.finish',
    defaultMessage: 'Finish'
  },
  finishContent: {
    id: 'pages.ResetPassword.finishContent',
    defaultMessage: '<p>Your password has been changed successfully.</p><p>You can now login with your username (which is {username}) and your new password</p>'
  },
  loginWithMyNewPassword: {
    id: 'pages.ResetPassword.loginWithMyNewPassword',
    defaultMessage: 'Login with my new password'
  }
})
