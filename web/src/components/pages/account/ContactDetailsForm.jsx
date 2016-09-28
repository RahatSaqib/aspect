import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import LocationSelector from '../../shared/LocationSelector'
import TextInput from '../../shared/TextInput'
import {emailAddress as validateEmailAddress} from '../../../utils/validate'
import styles from './AccountDetails.css'

const ContactDetailsForm = props => {
  const { handleSubmit, pristine, invalid, submitting } = props
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="name" label="Full Name" disabled={submitting} />
          <TextInput name="title" label="Job Title" disabled={submitting} />
        </section>
        <section>
          <h1>Email</h1>
          <TextInput name="email" label="Primary" disabled={submitting} />
          <TextInput name="email2" label="Secondary" disabled={submitting} />
        </section>
        <section>
          <h1>Phone</h1>
          <TextInput name="phone" label="Telephone" disabled={submitting} />
          <TextInput name="cell" label="Mobile" disabled={submitting} />
        </section>
        <section>
          <h1>Location</h1>
          <LocationSelector disabled={submitting} countryIdFieldName="countryId"
                            stateIdFieldName="stateId" lgaIdFieldName="lgaId"/>
          <TextInput name="zip" label="ZIP Code" disabled={submitting} />
        </section>
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || submitting} label="Save" secondary={true} type="submit" />
      </div>
    </form>
  )
  //TODO: Disable State and LGA inputs until parent item is selected
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
})(ContactDetailsForm)
