import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import LocationSelector from '../../shared/LocationSelector'
import TextInput from '../../shared/TextInput'
import PhoneInput from '../../shared/PhoneInput'
import {emailAddress as validateEmailAddress} from '../../../utils/validate'
import styles from './AccountDetails.css'

const messages = defineMessages({
  nameRequired: {
    id: 'pages.ContactDetailsForm.nameRequired',
    defaultMessage: 'Please enter your Full name'
  },
  invalidEmailAddress: {
    id: 'pages.ContactDetailsForm.invalidEmailAddress',
    defaultMessage: 'Please enter a valid email address'
  }
})

const ContactDetailsForm = props => {
  const { labels, handleSubmit, pristine, invalid, loading, initialValues } = props
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="name" label={labels.name} disabled={loading} maxLength="500" />
          <TextInput name="title" label={labels.title} disabled={loading} maxLength="255" />
        </section>
        <section>
          <h1>{labels.emailHeader}</h1>
          <TextInput name="email" label={labels.email} disabled={loading} maxLength="500" />
          <TextInput name="email2" label={labels.email2} disabled={loading} maxLength="500" />
        </section>
        <section>
          <h1>{labels.phoneHeader}</h1>
          <PhoneInput name="phone" label={labels.phone} disabled={loading} maxLength="40" />
          <PhoneInput name="cell" label={labels.cell} disabled={loading} maxLength="40" />
        </section>
        <section>
          <h1>{labels.locationHeader}</h1>
          <LocationSelector disabled={loading} countryIdFieldName="countryId"
                            initialValues={initialValues} stateIdFieldName="stateId"
                            lgaIdFieldName="lgaId" />
          <TextInput name="zip" label={labels.zip} disabled={loading} maxLength="45" />
        </section>
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={labels.submit} secondary={true} type="submit" />
      </div>
    </form>
  )
}

const validate = (accountDetails, props) => {
  const {formatMessage} = props.intl,
    errors = {}
  if (!accountDetails.get('name')) {
    errors.name = formatMessage(messages.nameRequired)
  }
  if (!validateEmailAddress(accountDetails.get('email')).optional().isValid()) {
    errors.email = formatMessage(messages.invalidEmailAddress)
  }
  if (!validateEmailAddress(accountDetails.get('email2')).optional().isValid()) {
    errors.email2 = formatMessage(messages.invalidEmailAddress)
  }
  return errors
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'accountDetails',
    validate
  }))(ContactDetailsForm)
