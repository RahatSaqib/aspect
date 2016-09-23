import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import {emailAddress as validateEmailAddress} from '../../../utils/validate'
import styles from './AccountDetails.css'

const renderNameField = ({ input, meta }) => {
  return (
    //TODO: i18n
    <TextField {...input} floatingLabelText="Name" fullWidth={true}
               errorStyle={{ float: 'left' }} errorText={meta.touched && meta.error} />
  )
}

const renderTitleField = ({ input, meta }) => {
  return (
    //TODO: i18n
    <TextField {...input} floatingLabelText="Job Title"
               errorStyle={{ float: 'left' }} errorText={meta.touched && meta.error} />
  )
}

const renderEmailField = ({ input, meta }) => {
  return (
    //TODO: i18n
    <TextField {...input} floatingLabelText="Email"
               errorStyle={{ float: 'left' }} errorText={meta.touched && meta.error} />
  )
}

const renderEmail2Field = ({ input, meta }) => {
  return (
    //TODO: i18n
    <TextField {...input} floatingLabelText="Alternate Email"
               errorStyle={{ float: 'left' }} errorText={meta.touched && meta.error} />
  )
}

const AccountDetailsForm = props => {
  const { handleSubmit, pristine, invalid, submitting } = props
  return (
    <Paper>
      <form onSubmit={handleSubmit} className={styles.Form}>
        <Field name="name" component={renderNameField} type="text" />
        <Field name="title" component={renderTitleField} type="text" />
        <Field name="email" component={renderEmailField} type="text" />
        <Field name="email2" component={renderEmail2Field} type="text" />
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
