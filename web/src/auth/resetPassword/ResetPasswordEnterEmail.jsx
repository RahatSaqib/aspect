// Imports from packages
import _ from 'lodash'
import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import { injectIntl } from 'react-intl'

// Material-UI
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import styles from './ResetPassword.css'
import messages from './messages'
import {emailAddress as validateEmailAddress} from '../../shared/utils/validate'
import TextInput from '../../components/shared/TextInput'

const ResetPasswordEnterEmail = props => {
  const { intl: { formatMessage }, handleSubmit, pristine, invalid } = props
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <p>{formatMessage(messages.enterEmailAddressContent)}</p>
        <TextInput name="emailAddress" label={formatMessage(messages.emailAddress)} autoFocus maxLength="500" fullWidth />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid} label={formatMessage(messages.next)} primary type="submit" />
        <FlatButton secondary label={formatMessage(messages.cancel)} href="/login" />
      </div>
    </form>
  )
}

const validate = (emailInput, props) => {
  const {formatMessage} = props.intl,
    errors = {}
  if (!validateEmailAddress(emailInput.get('emailAddress')).isValid()) {
    errors.emailAddress = formatMessage(messages.invalidEmailAddress)
  }
  return errors
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'resetPasswordEnterEmail',
    validate
  }))(ResetPasswordEnterEmail)
