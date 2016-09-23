import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'

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

export default reduxForm({
  form: 'accountDetails'
})(AccountDetailsForm)
