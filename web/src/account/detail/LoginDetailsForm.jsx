import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import styles from './AccountDetails.css'

const messages = defineMessages({
  username: {
    id: 'pages.LoginDetails.username',
    defaultMessage: 'Username'
  },
  newPassword: {
    id: 'pages.LoginDetails.newPassword',
    defaultMessage: 'New Password'
  },
  confirmNewPassword: {
    id: 'pages.LoginDetails.confirmNewPassword',
    defaultMessage: 'Confirm New Password'
  },
  save: {
    id: 'pages.LoginDetails.save',
    defaultMessage: 'Save'
  },
  currentPassword: {
    id: 'pages.LoginDetails.currentPassword',
    defaultMessage: 'Current Password'
  },
  usernameRequired: {
    id: 'pages.LoginDetails.usernameRequired',
    defaultMessage: 'A username is required'
  },
  usernameUnavailable: {
    id: 'pages.LoginDetails.usernameUnavailable',
    defaultMessage: 'This username is unavailable'
  },
  currentPasswordRequired: {
    id: 'pages.LoginDetails.currentPasswordRequired',
    defaultMessage: 'Please enter your current password to update your login details'
  },
  invalidPassword: {
    id: 'pages.LoginDetails.invalidPassword',
    defaultMessage: 'The password that you entered is not valid'
  },
  weakPassword: {
    id: 'pages.LoginDetails.weakPassword',
    defaultMessage: 'The password that you entered is too weak'
  },
  passwordsDoNotMatch: {
    id: 'pages.LoginDetails.passwordsDoNotMatch',
    defaultMessage: 'These passwords don\'t match'
  },
  currentPasswordDialogHeader: {
    id: 'pages.LoginDetails.currentPasswordDialogHeader',
    defaultMessage: 'Enter Current Password'
  },
  currentPasswordDialogMessage: {
    id: 'pages.LoginDetails.currentPasswordDialogMessage',
    defaultMessage: 'To update your login details, please enter your current password'
  },
  submitCurrentPassword: {
    id: 'pages.LoginDetails.submitCurrentPassword',
    defaultMessage: 'Submit'
  },
  cancelCurrentPassword: {
    id: 'pages.LoginDetails.cancelCurrentPassword',
    defaultMessage: 'Cancel'
  }
})

const LoginDetailsForm = props => {
  const { handleSubmit, pristine, invalid, loading,
      currentPasswordInputDialogOpen,
      openCurrentPasswordInputDialog,
      closeCurrentPasswordInputDialog} = props,
    {formatMessage} = props.intl,
    submitCurrentPassword = () => {
      closeCurrentPasswordInputDialog()
      handleSubmit()
    },
    onCurrentPasswordKeyPress = event => {
      if(event.key === 'Enter') {
        submitCurrentPassword()
      }
    },
    currentPasswordInputDialogActions = [
      <FlatButton label={formatMessage(messages.cancelCurrentPassword)} secondary
                  disabled={loading} onTouchTap={closeCurrentPasswordInputDialog} />,
      <FlatButton label={formatMessage(messages.submitCurrentPassword)} primary
                  disabled={pristine || invalid || loading} onTouchTap={submitCurrentPassword} />
    ]
  return (
    <form onSubmit={submitCurrentPassword} className={styles.Form}>
      <div className={styles.Form__Content}>
        <TextInput name="username" label={formatMessage(messages.username)} disabled={loading} maxLength="500" />
        <br />
        <StrongPasswordInput name="newPassword" label={formatMessage(messages.newPassword)}
                             disabled={loading} maxLength="100" />
        <TextInput name="confirmNewPassword" label={formatMessage(messages.confirmNewPassword)}
                   disabled={loading} maxLength="100" type="password" />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary
                      onTouchTap={openCurrentPasswordInputDialog} />
      </div>
      <Dialog title={formatMessage(messages.currentPasswordDialogHeader)}
              actions={currentPasswordInputDialogActions} modal={false}
              open={currentPasswordInputDialogOpen}
              onRequestClose={closeCurrentPasswordInputDialog}>
        {formatMessage(messages.currentPasswordDialogMessage)}
        <TextInput name="currentPassword" autoFocus fullWidth disabled={loading} maxLength="100"
                   onKeyPress={onCurrentPasswordKeyPress} type="password" />
      </Dialog>
    </form>
  )
}

const validate = (loginDetails, props) => {
  const {formatMessage} = props.intl,
    errors = {}
  if (!loginDetails.get('username')) {
    errors.username = formatMessage(messages.usernameRequired)
  }
  if (!loginDetails.get('currentPassword')) {
    errors.currentPassword = formatMessage(messages.currentPasswordRequired)
  }
  if (loginDetails.get('newPassword')) {
    //TODO: messages.weakPassword

    if (loginDetails.get('newPassword') !== loginDetails.get('confirmNewPassword')) {
      errors.confirmNewPassword = formatMessage(messages.passwordsDoNotMatch)
    }
  }
  return errors
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'loginDetails',
    validate
  }))(LoginDetailsForm)
