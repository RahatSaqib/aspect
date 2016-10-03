import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import LocationSelector from '../../shared/LocationSelector'
import TextInput from '../../shared/TextInput'
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
  const { labels, handleSubmit, pristine, invalid, submitting, initialValues } = props
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="name" label={labels.name} disabled={submitting} maxLength="500" />
          <TextInput name="title" label={labels.title} disabled={submitting} maxLength="255" />
        </section>
        <section>
          <h1>{labels.emailHeader}</h1>
          <TextInput name="email" label={labels.email} disabled={submitting} maxLength="500" />
          <TextInput name="email2" label={labels.email2} disabled={submitting} maxLength="500" />
        </section>
        <section>
          <h1>{labels.phoneHeader}</h1>
          <TextInput name="phone" label={labels.phone} disabled={submitting} maxLength="40" />
          <TextInput name="cell" label={labels.cell} disabled={submitting} maxLength="40" />
        </section>
        <section>
          <h1>{labels.locationHeader}</h1>
          <LocationSelector disabled={submitting} countryIdFieldName="countryId"
                            initialValues={initialValues} stateIdFieldName="stateId"
                            lgaIdFieldName="lgaId" />
          <TextInput name="zip" label={labels.zip} disabled={submitting} maxLength="45" />
        </section>
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || submitting} label={labels.submit} secondary={true} type="submit" />
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
