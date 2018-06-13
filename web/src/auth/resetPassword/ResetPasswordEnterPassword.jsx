import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withState, pure } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'

import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import recomposeForm from '../../components/recomposeForm'
import messages from './messages'

const cssClasses = classnames.bind(require('./ResetPassword.css'))

export function validate({ newPassword, confirmNewPassword }, { intl }) {
  const errors = {}
  if (newPassword) {
    if (newPassword.trim().length < 8) {
      errors.newPassword = intl.formatMessage(messages.newPasswordTooShort)
    } else if (
      !/\d/.test(newPassword) &&
      !/(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/.test(newPassword)
    ) {
      errors.newPassword = intl.formatMessage(
        messages.newPasswordMustContainANumberOrSpecialCharacter
      )
    }
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = intl.formatMessage(
        messages.passwordsDoNotMatch
      )
    }
  } else {
    errors.newPassword = intl.formatMessage(messages.newPasswordRequired)
  }
  return errors
}

const enhance = compose(
  pure,
  withState('values', 'onChange', {
    newPassword: '',
    confirmNewPassword: '',
  }),
  recomposeForm({
    fields: [
      'newPassword',
      {
        fieldName: 'confirmNewPassword',
        valueFromChangeEvent: _.identity,
      },
    ],
    validate,
  })
)

export const ResetPasswordEnterPassword = ({
  intl,
  action,
  form,
  values,
  meta,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  handleSubmit,
}) => (
  <form onSubmit={handleSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <p>{intl.formatMessage(messages.enterNewPasswordContent)}</p>
      <StrongPasswordInput
        // TODO: refactor StrongPasswordInput into react-toolbox or HOC
        intl={intl}
        input={{
          value: values.newPassword,
          onChange: onNewPasswordChange,
        }}
        meta={meta.newPassword}
        textFieldProps={{
          floatingLabelText: intl.formatMessage(messages.newPassword),
          type: 'password',
          name: 'newPassword',
          maxLength: 100,
          autoFocus: true,
          fullWidth: true,
        }}
        popOverProps={{}}
      />
      <Input
        type="password"
        name="confirmNewPassword"
        label={intl.formatMessage(messages.confirmNewPassword)}
        value={values.confirmNewPassword}
        onChange={onConfirmNewPasswordChange}
        error={meta.confirmNewPassword.touched && meta.confirmNewPassword.error}
        maxLength={500}
      />
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        primary
        raised
        disabled={form.pristine || !form.valid || form.submitting}
        label={intl.formatMessage(messages.next)}
      />
      {action}
    </div>
  </form>
)

export default enhance(ResetPasswordEnterPassword)
