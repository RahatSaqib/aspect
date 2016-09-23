import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'
import {emailAddress as validateEmailAddress} from '../../../utils/validate'

const AccountDetailsForm = props => {
  const { initialValues, handleSubmit, pristine, submitting } = props
  return (
    <form onSubmit={handleSubmit}>
      <div>
        Username: {initialValues.get('username')}
        <br/>
        Full Name: {initialValues.get('name')}
      </div>
      <div>
        <label>Username</label>
        <div>
          <Field name="username" component="input" type="text" />
        </div>
      </div>
      <div>
        <label>Full Name</label>
        <div>
          <Field name="name" component="input" type="text" />
        </div>
      </div>
      <div>
        <button type="submit" disabled={pristine || submitting}>Submit</button>
      </div>
    </form>
  )
}

const validate = acccountDetails => {
  const errors = {}
  if (!acccountDetails.get('name')) {
    //TODO: i18n
    errors.user = 'Please enter your Full name'
  }
  if (validateEmailAddress(acccountDetails.get('email').optional().isValid())) {
    errors.email = 'Please enter a valid email address'
  }
  if (validateEmailAddress(acccountDetails.get('email2').optional().isValid())) {
    errors.email2 = 'Please enter a valid email address'
  }
  return errors
}

export default reduxForm({
  form: 'accountDetails',
  validate
})(AccountDetailsForm)
