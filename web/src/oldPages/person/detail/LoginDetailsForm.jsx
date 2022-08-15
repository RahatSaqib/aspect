import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import AspectSwitch from '../../../oldComponents/shared/AspectSwitch'
import StrongPasswordInput from '../../../oldComponents/shared/StrongPasswordInput'
import recomposeForm from '../../../oldComponents/recomposeForm'
import messages from './messages'

import styles from './PersonDetail.css'

const cssClasses = classnames.bind(styles)

const hasError = field => field.touched && field.error

export function validate(
  { username, newPassword, confirmNewPassword, currentPassword },
  { intl, currentPasswordInputDialogOpen }
) {
  const errors = {}
  if (!username) {
    errors.username = intl.formatMessage(messages.usernameRequired)
  }
  if (currentPasswordInputDialogOpen === true && !currentPassword) {
    errors.currentPassword = intl.formatMessage(messages.currentPasswordRequired)
  }
  if (newPassword) {
    if (newPassword.trim().length < 8) {
      errors.newPassword = intl.formatMessage(messages.newPasswordTooShort)
    } else if (!/\d/.test(newPassword) && !/(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/.test(newPassword)) {
      errors.newPassword = intl.formatMessage(messages.newPasswordMustContainANumberOrSpecialCharacter)
    }
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = intl.formatMessage(messages.passwordsDoNotMatch)
    }
  } else {
    errors.newPassword = intl.formatMessage(messages.newPasswordRequired)
  }
  return errors
}

const DEFAULT_VALUES = {
  username: '',
  newPassword: '',
  confirmNewPassword: '',
  currentPassword: '',
  userLockedOut: false,
}

const getInitialValues = (loginDetails, shouldPrefill, emailValue) => ({
  ...DEFAULT_VALUES,
  username: shouldPrefill ? emailValue : loginDetails.get('username') || DEFAULT_VALUES.username,
  // username: loginDetails.get('username') || DEFAULT_VALUES.username,
  userLockedOut: loginDetails.get('userLockedOut') || DEFAULT_VALUES.userLockedOut,
  shouldPrefill,
})

const enhance = compose(
  pure,
  lifecycle({
    UNSAFE_componentWillMount() {
      const onChange = values => this.setState({ values })
      this.setState({
        onChange,
        values: getInitialValues(this.props.loginDetails, this.props.shouldPrefill, this.props.emailValue),
      })
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      const { loginDetails, shouldPrefill, emailValue } = nextProps

      if (this.props.loginDetails !== loginDetails) {
        // Re-initialize
        this.state.onChange(getInitialValues(loginDetails, shouldPrefill, emailValue))
      }
    },
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'username',
        valueFromChangeEvent: it => it.target.value,
      },
      'currentPassword',
      {
        fieldName: 'confirmNewPassword',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'newPassword',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'userLockedOut',
        valueFromChangeEvent: it => it.target.checked,
      },
    ],
    validate,
  }),
  withHandlers({
    onSubmit:
      ({ openCurrentPasswordInputDialog, handleSubmit }) =>
      event => {
        if (openCurrentPasswordInputDialog) {
          event.preventDefault()
          return openCurrentPasswordInputDialog()
        }
        return handleSubmit(event)
      },

    onCurrentPasswordKeyPress:
      ({ handleSubmit }) =>
      event => {
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
  canModify = true,
  // classes,
  // --- injected by recompose ---
  onSubmit,
  form,
  values,
  meta: { username, newPassword, confirmNewPassword, currentPassword },
  onUsernameChange,
  onNewPasswordChange,
  onUserLockedOutChange,
  onConfirmNewPasswordChange,
  onCurrentPasswordChange,
  onCurrentPasswordKeyPress,
  handleSubmit,
}) => (
  <form onSubmit={onSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <TextField
        autoFocus
        fullWidth
        type="text"
        name="username"
        label={intl.formatMessage(messages.username)}
        value={values.username}
        onChange={onUsernameChange}
        disabled={loading}
        error={!!hasError(username)}
        helperText={hasError(username)}
        inputProps={{ maxLength: 255 }}
        margin="normal"
        FormHelperTextProps={{
          margin: 'dense',
        }}
      />
      <StrongPasswordInput
        intl={intl}
        input={{
          value: values.newPassword,
          onChange: onNewPasswordChange,
        }}
        disabled={loading}
        meta={newPassword}
        textFieldProps={{
          type: 'password',
          name: 'newPassword',
          maxLength: 100,
          autoFocus: true,
          fullWidth: true,
          label: intl.formatMessage(messages.newPassword),
          helperText: hasError(newPassword),
          error: !!hasError(newPassword),
        }}
        popOverProps={{}}
      />
      <br />
      <TextField
        autoFocus
        fullWidth
        type="password"
        name="confirmNewPassword"
        label={intl.formatMessage(messages.confirmNewPassword)}
        value={values.confirmNewPassword}
        onChange={onConfirmNewPasswordChange}
        disabled={loading}
        error={!!hasError(confirmNewPassword)}
        helperText={hasError(confirmNewPassword)}
        inputProps={{ maxLength: 100 }}
      />
      {canModify && (
        <AspectSwitch
          name="userLockedOut"
          checked={values.userLockedOut}
          onChange={onUserLockedOutChange}
          labelText={intl.formatMessage(messages.userLockedOutLabel)}
        />
      )}
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        color="primary"
        variant="contained"
        disabled={loading || form.pristine || !form.valid || form.submitting}
      >
        {intl.formatMessage(messages.save)}
      </Button>
    </div>
    <AspectDialog
      actions={[
        <Button color="primary" disabled={loading} onClick={closeCurrentPasswordInputDialog}>
          {intl.formatMessage(messages.cancelCurrentPassword)}
        </Button>,
        <Button
          color="primary"
          disabled={loading || form.pristine || !form.valid || form.submitting}
          onClick={handleSubmit}
        >
          {intl.formatMessage(messages.submitCurrentPassword)}
        </Button>,
      ]}
      open={currentPasswordInputDialogOpen || false}
      onClose={closeCurrentPasswordInputDialog}
      title={intl.formatMessage(messages.currentPasswordDialogHeader)}
    >
      <p>{intl.formatMessage(messages.currentPasswordDialogMessage)}</p>
      <TextField
        autoFocus
        fullWidth
        type="password"
        name="currentPassword"
        value={values.currentPassword}
        onChange={onCurrentPasswordChange}
        onKeyPress={onCurrentPasswordKeyPress}
        disabled={loading}
        error={!!hasError(currentPassword)}
        helperText={hasError(currentPassword)}
        inputProps={{ maxLength: 100 }}
        margin="normal"
        FormHelperTextProps={{
          margin: 'dense',
        }}
      />
    </AspectDialog>
  </form>
)

export default enhance(LoginDetailsForm)
