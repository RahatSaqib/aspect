import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
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
  }
})

const LoginDetailsForm = props => {
  const { handleSubmit, pristine, invalid, loading } = props,
    {formatMessage} = props.intl
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <TextInput name="username" label={formatMessage(messages.username)} disabled={loading} maxLength="500" />
        <br />
        <StrongPasswordInput name="newPassword" label={formatMessage(messages.newPassword)} disabled={loading} maxLength="100" />
        <TextInput name="confirmNewPassword" label={formatMessage(messages.confirmNewPassword)} disabled={loading} maxLength="100" type="password" />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary={true} type="button" />
      </div>
    </form>
  )
}

const validate = (accountDetails, props) => {
  const {formatMessage} = props.intl,
    errors = {}
  if (!accountDetails.get('username')) {
    errors.username = formatMessage(messages.usernameRequired)
  }
  //TODO: messages.usernameUnavailable
  //TODO: messages.currentPasswordRequired: If any details are dirty, validate that current password has been entered and is correct
  //TODO: messages.invalidPassword: Check that current password is correct
  if (accountDetails.get('newPassword')) {
    //TODO: messages.weakPassword

    if (accountDetails.get('newPassword') !== accountDetails.get('confirmNewPassword')) {
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
