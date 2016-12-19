// Imports from packages
import _ from 'lodash'
import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import { injectIntl } from 'react-intl'
import { Link } from 'react-router'

// Material-UI
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import styles from './ResetPassword.css'
import messages from './messages'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'

export function ResetPasswordEnterPassword({
  intl, handleSubmit, pristine, invalid
}) {
  const { formatMessage } = intl
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <p>{formatMessage(messages.enterNewPasswordContent)}</p>
        <StrongPasswordInput
          name="newPassword" label={formatMessage(messages.newPassword)}
          maxLength="100" autoFocus fullWidth
        />
        <TextInput
          name="confirmNewPassword" label={formatMessage(messages.confirmNewPassword)}
          maxLength="100" type="password" fullWidth
        />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid} label={formatMessage(messages.next)} primary type="submit" />
        <Link to="login">
          <FlatButton secondary label={formatMessage(messages.cancel)} />
        </Link>
      </div>
    </form>
  )
}

export function validate(passwordInput, props) {
  const { formatMessage } = props.intl
  const errors = {}
  if (passwordInput.get('newPassword')) {
    if (passwordInput.get('newPassword').trim().length < 8) {
      errors.newPassword = formatMessage(messages.newPasswordTooShort)
    } else if (!/\d/.test(passwordInput.get('newPassword')) &&
      !/(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/.test(passwordInput.get('newPassword'))) {
      errors.newPassword = formatMessage(messages.newPasswordMustContainANumberOrSpecialCharacter)
    }
    if (passwordInput.get('newPassword') !== passwordInput.get('confirmNewPassword')) {
      errors.confirmNewPassword = formatMessage(messages.passwordsDoNotMatch)
    }
  } else {
    errors.newPassword = formatMessage(messages.newPasswordRequired)
  }
  return errors
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'resetPasswordEnterNewPassword',
    validate
  }))(ResetPasswordEnterPassword)
