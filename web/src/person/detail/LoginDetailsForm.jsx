import React, { PropTypes } from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import _ from 'lodash'
import { injectIntl } from 'react-intl'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import messages from './messages'
import styles from './PersonDetail.css'

export function LoginDetailsForm({
  intl, handleSubmit, pristine, invalid, loading,
  currentPasswordInputDialogOpen, openCurrentPasswordInputDialog,
  closeCurrentPasswordInputDialog
}) {
  const { formatMessage } = intl
  const onCurrentPasswordKeyPress = (event) => {
    if (event.key === 'Enter') {
      return handleSubmit()
    }
  }
  const handleSaveButtonClicked = () => {
    if (openCurrentPasswordInputDialog) {
      return openCurrentPasswordInputDialog()
    }
    return handleSubmit()
  }
  const currentPasswordInputDialogActions = [
    <FlatButton
      label={formatMessage(messages.cancelCurrentPassword)} secondary
      disabled={loading} onTouchTap={closeCurrentPasswordInputDialog}
    />,
    <FlatButton
      label={formatMessage(messages.submitCurrentPassword)} primary
      disabled={pristine || invalid || loading} onTouchTap={handleSubmit}
    />]
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="username" label={formatMessage(messages.username)} disabled={loading} maxLength="255" />
          <br />
          <StrongPasswordInput
            name="newPassword" label={formatMessage(messages.newPassword)}
            disabled={loading} maxLength="100"
            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            targetOrigin={{ horizontal: 'left', vertical: 'center' }}
          />
          <TextInput
            name="confirmNewPassword" label={formatMessage(messages.confirmNewPassword)}
            disabled={loading} maxLength="100" type="password"
          />
        </section>
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton
          disabled={pristine || invalid || loading} label={formatMessage(messages.save)}
          secondary onTouchTap={handleSaveButtonClicked}
        />
      </div>
      <Dialog
        title={formatMessage(messages.currentPasswordDialogHeader)}
        actions={currentPasswordInputDialogActions} modal={false}
        open={currentPasswordInputDialogOpen || false}
        onRequestClose={closeCurrentPasswordInputDialog}
      >
        {formatMessage(messages.currentPasswordDialogMessage)}
        <TextInput
          name="currentPassword" autoFocus fullWidth disabled={loading}
          maxLength="100" style={{ marginRight: '0' }}
          onKeyPress={onCurrentPasswordKeyPress} type="password"
        />
      </Dialog>
    </form>
  )
}

LoginDetailsForm.propTypes = {
  loading: PropTypes.bool,
  currentPasswordInputDialogOpen: PropTypes.bool,
  openCurrentPasswordInputDialog: PropTypes.func,
  closeCurrentPasswordInputDialog: PropTypes.func,
  intl: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired
}

LoginDetailsForm.defaultProps = {
  loading: true,
  currentPasswordInputDialogOpen: false,
  openCurrentPasswordInputDialog: undefined,
  closeCurrentPasswordInputDialog: undefined
}

export function validate(loginDetails, props) {
  const { formatMessage } = props.intl
  const errors = {}
  if (loginDetails) {
    if (!loginDetails.get('username')) {
      errors.username = formatMessage(messages.usernameRequired)
    }
    if (!loginDetails.get('currentPassword')) {
      errors.currentPassword = formatMessage(messages.currentPasswordRequired)
    }
    if (loginDetails.get('newPassword')) {
      if (loginDetails.get('newPassword').trim().length < 8) {
        errors.newPassword = formatMessage(messages.newPasswordTooShort)
      } else if (!/\d/.test(loginDetails.get('newPassword')) &&
        !/(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/.test(loginDetails.get('newPassword'))) {
        errors.newPassword = formatMessage(messages.newPasswordMustContainANumberOrSpecialCharacter)
      }
      if (loginDetails.get('newPassword') !== loginDetails.get('confirmNewPassword')) {
        errors.confirmNewPassword = formatMessage(messages.passwordsDoNotMatch)
      }
    }
  }
  return errors
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'loginDetails',
    enableReinitialize: true,
    validate
  }))(LoginDetailsForm)
