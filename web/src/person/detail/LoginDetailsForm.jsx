import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'
import { Dialog } from 'react-toolbox/lib/dialog'

import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import recomposeForm from '../../components/recomposeForm'
import messages from './messages'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export function validate(
  { username, newPassword, confirmNewPassword, currentPassword },
  { intl, currentPasswordInputDialogOpen }
) {
  const errors = {}
  if (!username) {
    errors.username = intl.formatMessage(messages.usernameRequired)
  }
  if (currentPasswordInputDialogOpen === true && !currentPassword) {
    errors.currentPassword = intl.formatMessage(
      messages.currentPasswordRequired
    )
  }
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
  }
  return errors
}

const DEFAULT_VALUES = {
  username: '',
  newPassword: '',
  confirmNewPassword: '',
  currentPassword: '',
}

const getInitialValues = loginDetails => ({
  ...DEFAULT_VALUES,
  username: loginDetails.get('username') || DEFAULT_VALUES.username,
})

const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })

      this.setState({
        onChange,
        values: getInitialValues(this.props.loginDetails),
      })
    },

    componentWillReceiveProps(nextProps) {
      const { loginDetails } = nextProps
      if (this.props.loginDetails !== loginDetails) {
        // Re-initialize
        this.state.onChange(getInitialValues(loginDetails))
      }
    },
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'username',
        valueFromChangeEvent: _.identity,
      },
      'newPassword',
      {
        fieldName: 'confirmNewPassword',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'currentPassword',
        valueFromChangeEvent: _.identity,
      },
    ],
    validate,
  }),
  withHandlers({
    onSubmit: ({ openCurrentPasswordInputDialog, handleSubmit }) => event => {
      if (openCurrentPasswordInputDialog) {
        event.preventDefault()
        return openCurrentPasswordInputDialog()
      }
      return handleSubmit(event)
    },

    onCurrentPasswordKeyPress: ({ handleSubmit }) => event => {
      if (event.key === 'Enter') {
        return handleSubmit(event)
      }
    },
  })
)

export const LoginDetailsForm = ({
  intl,
  loading,
  currentPasswordInputDialogOpen,
  closeCurrentPasswordInputDialog,
  // --- injected by recompose ---
  onSubmit,
  form,
  values,
  meta,
  onUsernameChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onCurrentPasswordChange,
  onCurrentPasswordKeyPress,
  handleSubmit,
}) =>
  <form onSubmit={onSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <Input
        type="text"
        name="username"
        label={intl.formatMessage(messages.username)}
        value={values.username}
        onChange={onUsernameChange}
        disabled={loading}
        error={meta.username.touched && meta.username.error}
        maxLength={255}
      />
      <br />
      <StrongPasswordInput
        // TODO: refactor StrongPasswordInput into react-toolbox or HOC
        intl={intl}
        input={{
          value: values.newPassword,
          onChange: onNewPasswordChange,
        }}
        disabled={loading}
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
        disabled={loading}
        error={meta.confirmNewPassword.touched && meta.confirmNewPassword.error}
        maxLength={100}
      />
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        primary
        raised
        disabled={loading || form.pristine || !form.valid || form.submitting}
        label={intl.formatMessage(messages.save)}
      />
    </div>
    <Dialog
      actions={[
        {
          label: intl.formatMessage(messages.cancelCurrentPassword),
          onClick: closeCurrentPasswordInputDialog,
          disabled: loading,
        },
        {
          label: intl.formatMessage(messages.submitCurrentPassword),
          onClick: handleSubmit,
          disabled: loading || form.pristine || !form.valid || form.submitting,
        },
      ]}
      active={currentPasswordInputDialogOpen || false}
      onEscKeyDown={closeCurrentPasswordInputDialog}
      onOverlayClick={closeCurrentPasswordInputDialog}
      title={intl.formatMessage(messages.currentPasswordDialogHeader)}
    >
      <p>
        {intl.formatMessage(messages.currentPasswordDialogMessage)}
      </p>
      <Input
        type="password"
        name="currentPassword"
        value={values.currentPassword}
        onChange={onCurrentPasswordChange}
        onKeyPress={onCurrentPasswordKeyPress}
        disabled={loading}
        error={meta.currentPassword.touched && meta.currentPassword.error}
        maxLength={100}
      />
    </Dialog>
  </form>

export default enhance(LoginDetailsForm)
