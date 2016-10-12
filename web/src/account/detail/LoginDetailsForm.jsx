import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import styles from './AccountDetails.css'

const messages = defineMessages({
  usernameRequired: {
    id: 'pages.LoginDetailsForm.usernameRequired',
    defaultMessage: 'A username is required'
  },
  usernameUnavailable: {
    id: 'pages.LoginDetailsForm.usernameUnavailable',
    defaultMessage: 'This username is unavailable'
  },
  currentPasswordRequired: {
    id: 'pages.LoginDetailsForm.currentPasswordRequired',
    defaultMessage: 'Please enter your current password to update your login details'
  },
  invalidPassword: {
    id: 'pages.LoginDetailsForm.invalidPassword',
    defaultMessage: 'The password that you entered is not valid'
  },
  weakPassword: {
    id: 'pages.LoginDetailsForm.weakPassword',
    defaultMessage: 'The password that you entered is too weak'
  },
  passwordsDoNotMatch: {
    id: 'pages.LoginDetailsForm.passwordsDoNotMatch',
    defaultMessage: 'These passwords don\'t match'
  }
})

const LoginDetailsForm = props => {
  const { labels, handleSubmit, pristine, invalid, loading } = props
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="username" label={labels.username} disabled={loading} maxLength="500" />
        </section>
        <section>
          <h1>{labels.passwordHeader}</h1>
          <TextInput name="currentPassword" label={labels.currentPassword} disabled={loading} maxLength="100" type="password" />
          <div>
            <StrongPasswordInput name="newPassword" label={labels.newPassword} disabled={loading} maxLength="100" />
            <TextInput name="confirmNewPassword" label={labels.confirmNewPassword} disabled={loading} maxLength="100" type="password" />
          </div>
        </section>
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={labels.submit} secondary={true} type="submit" />
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
