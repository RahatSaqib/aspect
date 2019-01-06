import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
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
        valueFromChangeEvent: it => it.target.value,
      },
      'newPassword',
      {
        fieldName: 'confirmNewPassword',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'currentPassword',
        valueFromChangeEvent: it => it.target.value,
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
        error={meta.username.touched && meta.username.error}
        helperText={meta.username.touched && meta.username.error}
        inputProps={{ maxLength: 255 }}
        margin="normal"
        FormHelperTextProps={{
          margin: 'dense',
        }}
      />
      <br />
      <StrongPasswordInput
        intl={intl}
        input={{
          type: 'password',
          name: 'newPassword',
          autoFocus: true,
          fullWidth: true,
          label: intl.formatMessage(messages.newPassword),
          value: values.newPassword,
          onChange: onNewPasswordChange,
          inputProps: { maxLength: 100 },
        }}
        disabled={loading}
        meta={meta.newPassword}
        popOverProps={{}}
      />
      <TextField
        autoFocus
        fullWidth
        type="password"
        name="confirmNewPassword"
        label={intl.formatMessage(messages.confirmNewPassword)}
        value={values.confirmNewPassword}
        onChange={onConfirmNewPasswordChange}
        disabled={loading}
        error={meta.confirmNewPassword.touched && meta.confirmNewPassword.error}
        helperText={
          meta.confirmNewPassword.touched && meta.confirmNewPassword.error
        }
        inputProps={{ maxLength: 100 }}
      />
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
        error={meta.currentPassword.touched && meta.currentPassword.error}
        helperText={meta.currentPassword.touched && meta.currentPassword.error}
        inputProps={{ maxLength: 100 }}
        margin="normal"
        FormHelperTextProps={{
          margin: 'dense',
        }}
      />
    </Dialog>
  </form>
)

export default enhance(LoginDetailsForm)
