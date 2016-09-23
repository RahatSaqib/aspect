import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import TextInput from '../../shared/TextInput'
import {emailAddress as validateEmailAddress} from '../../../utils/validate'
import styles from './AccountDetails.css'

const AccountDetailsForm = props => {
  const { handleSubmit, pristine, invalid, submitting } = props
  return (
    <Paper>
      <form onSubmit={handleSubmit} className={styles.Form}>
        <TextInput name="name" label="Name" disabled={submitting} fullWidth />
        <TextInput name="title" label="Job Title" disabled={submitting} fullWidth />
        <TextInput name="email" label="Email" disabled={submitting} fullWidth />
        <TextInput name="email2" label="Alternate Email" disabled={submitting} fullWidth />
        <div className={styles.Form__ActionRow}>
          <RaisedButton disabled={pristine || invalid || submitting} label="Save" secondary={true} type="submit" />
        </div>
      </form>
    </Paper>
  )
}

const validate = acccountDetails => {
  const errors = {}
  if (!acccountDetails.get('name')) {
    //TODO: i18n
    errors.user = 'Please enter your Full name'
  }
  if (!validateEmailAddress(acccountDetails.get('email')).optional().isValid()) {
    errors.email = 'Please enter a valid email address'
  }
  if (!validateEmailAddress(acccountDetails.get('email2')).optional().isValid()) {
    errors.email2 = 'Please enter a valid email address'
  }
  return errors
}

export default reduxForm({
  form: 'accountDetails',
  validate
})(AccountDetailsForm)
