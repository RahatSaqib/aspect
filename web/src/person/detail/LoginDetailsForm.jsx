import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import TextInput from '../../components/shared/TextInput'
import SelectInput from '../../components/shared/SelectInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import styles from './PersonDetail.css'

const messages = defineMessages({
  username: {
    id: 'pages.UpdateLoginDetails.username',
    defaultMessage: 'Username'
  },
  newPassword: {
    id: 'pages.UpdateLoginDetails.newPassword',
    defaultMessage: 'New Password'
  },
  confirmNewPassword: {
    id: 'pages.UpdateLoginDetails.confirmNewPassword',
    defaultMessage: 'Confirm New Password'
  },
  partnerAndRoles: {
    id: 'pages.UpdateLoginDetails.partnerAndRoles',
    defaultMessage: 'Partner & Roles'
  },
  partner: {
    id: 'pages.UpdateLoginDetails.partner',
    defaultMessage: 'Partner'
  },
  organisationalUnit: {
    id: 'pages.UpdateLoginDetails.organisationalUnit',
    defaultMessage: 'Organizational Unit'
  },
  save: {
    id: 'pages.UpdateLoginDetails.save',
    defaultMessage: 'Save'
  },
  currentPassword: {
    id: 'pages.UpdateLoginDetails.currentPassword',
    defaultMessage: 'Current Password'
  },
  usernameRequired: {
    id: 'pages.UpdateLoginDetails.usernameRequired',
    defaultMessage: 'A username is required'
  },
  currentPasswordRequired: {
    id: 'pages.UpdateLoginDetails.currentPasswordRequired',
    defaultMessage: 'Please enter your current password to update your login details'
  },
  newPasswordTooShort: {
    id: 'pages.UpdateLoginDetails.newPasswordTooShort',
    defaultMessage: 'The password needs to be at least 8 characters long'
  },
  newPasswordMustContainANumberOrSpecialCharacter: {
    id: 'pages.UpdateLoginDetails.newPasswordMustContainANumberOrSpecialCharacter',
    defaultMessage: 'The password needs to contain at least one number or special character (%!$*...)'
  },
  passwordsDoNotMatch: {
    id: 'pages.UpdateLoginDetails.passwordsDoNotMatch',
    defaultMessage: 'These passwords don\'t match'
  },
  currentPasswordDialogHeader: {
    id: 'pages.UpdateLoginDetails.currentPasswordDialogHeader',
    defaultMessage: 'Enter Current Password'
  },
  currentPasswordDialogMessage: {
    id: 'pages.UpdateLoginDetails.currentPasswordDialogMessage',
    defaultMessage: 'To update your login details, please enter your current password'
  },
  submitCurrentPassword: {
    id: 'pages.UpdateLoginDetails.submitCurrentPassword',
    defaultMessage: 'Submit'
  },
  cancelCurrentPassword: {
    id: 'pages.UpdateLoginDetails.cancelCurrentPassword',
    defaultMessage: 'Cancel'
  },
  usernameUnavailable: {
    id: 'pages.UpdateLoginDetails.usernameUnavailable',
    defaultMessage: 'This username is unavailable'
  },
  invalidPassword: {
    id: 'pages.UpdateLoginDetails.invalidPassword',
    defaultMessage: 'The password that you entered is not valid'
  }
})

const LoginDetailsForm = props => {
  const { handleSubmit, pristine, invalid, loading,
      currentPasswordInputDialogOpen,
      openCurrentPasswordInputDialog,
      closeCurrentPasswordInputDialog, showRolesPanel} = props,
    partners = props.partners || [],
    organisationalUnits = props.organisationalUnits || [],
    {formatMessage} = props.intl,
    onCurrentPasswordKeyPress = event => {
      if(event.key === 'Enter') {
        return handleSubmit()
      }
    },
    handleSaveButtonClicked = () => {
      if(openCurrentPasswordInputDialog) {
        return openCurrentPasswordInputDialog()
      } else {
        return handleSubmit()
      }
    },
    currentPasswordInputDialogActions = [
      <FlatButton label={formatMessage(messages.cancelCurrentPassword)} secondary
                  disabled={loading} onTouchTap={closeCurrentPasswordInputDialog} />,
      <FlatButton label={formatMessage(messages.submitCurrentPassword)} primary
                  disabled={pristine || invalid || loading} onTouchTap={handleSubmit} />
    ]
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="username" label={formatMessage(messages.username)} disabled={loading} maxLength="500" />
          <br />
          <StrongPasswordInput name="newPassword" label={formatMessage(messages.newPassword)}
                               disabled={loading} maxLength="100"
                               anchorOrigin={{horizontal: 'right',vertical:'top'}}
                               targetOrigin={{horizontal: 'left',vertical:'center'}} />
          <TextInput name="confirmNewPassword" label={formatMessage(messages.confirmNewPassword)}
                     disabled={loading} maxLength="100" type="password" />
        </section>
        {showRolesPanel && <section>
          <h1>{formatMessage(messages.partnerAndRoles)}</h1>
          <SelectInput name="partnerId" label={formatMessage(messages.partner)}
                       disabled={loading || _.isEmpty(partners)} autoWidth
                       dataSource={partners} dataSourceConfig={{ text: 'name', value: 'id' }} />
          <SelectInput name="orgUnitId" label={formatMessage(messages.organisationalUnit)}
                       disabled={loading || _.isEmpty(organisationalUnits)} autoWidth
                       dataSource={organisationalUnits} dataSourceConfig={{ text: 'name', value: 'id' }} />
          <br />
          <div>
            Select Partner &amp; Organisational Unit
          </div>
        </section>}
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)}
                      secondary onTouchTap={handleSaveButtonClicked} />
      </div>
      <Dialog title={formatMessage(messages.currentPasswordDialogHeader)}
              actions={currentPasswordInputDialogActions} modal={false}
              open={currentPasswordInputDialogOpen || false}
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
    if(loginDetails.get('newPassword').trim().length < 8) {
      errors.newPassword = formatMessage(messages.newPasswordTooShort)
    } else if (!/\d/.test(loginDetails.get('newPassword')) &&
      !/(?=.*?[`~!@#$%\^&*()\-=_+\\\[\]{}/?,.<>])/.test(loginDetails.get('newPassword'))) {
      errors.newPassword = formatMessage(messages.newPasswordMustContainANumberOrSpecialCharacter)
    }
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
