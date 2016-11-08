import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import LocationSelector from '../../components/shared/LocationSelector'
import TextInput from '../../components/shared/TextInput'
import PhoneInput from '../../components/shared/PhoneInput'
import SelectInput from '../../components/shared/SelectInput'
import {emailAddress as validateEmailAddress} from '../../shared/utils/validate'
import styles from './PersonDetail.css'

const messages = defineMessages({
  fullName: {
    id: 'pages.ContactDetails.name',
    defaultMessage: 'Full Name'
  },
  jobTitle: {
    id: 'pages.ContactDetails.title',
    defaultMessage: 'Job Title'
  },
  emailHeader: {
    id: 'pages.ContactDetails.emailHeader',
    defaultMessage: 'Email'
  },
  primaryEmail: {
    id: 'pages.ContactDetails.email',
    defaultMessage: 'Primary'
  },
  secondaryEmail: {
    id: 'pages.ContactDetails.email2',
    defaultMessage: 'Alternate'
  },
  phone: {
    id: 'pages.ContactDetails.phoneHeader',
    defaultMessage: 'Phone'
  },
  telephone: {
    id: 'pages.ContactDetails.phone',
    defaultMessage: 'Telephone'
  },
  mobile: {
    id: 'pages.AccountDetails.cell',
    defaultMessage: 'Mobile'
  },
  partner: {
    id: 'pages.AccountDetails.partner',
    defaultMessage: 'Partner'
  },
  location: {
    id: 'pages.ContactDetails.locationHeader',
    defaultMessage: 'Location'
  },
  zip: {
    id: 'pages.ContactDetails.zip',
    defaultMessage: 'Zip Code'
  },
  notes: {
    id: 'pages.ContactDetails.notes',
    defaultMessage: 'Notes'
  },
  save: {
    id: 'pages.ContactDetails.save',
    defaultMessage: 'Save'
  },
  nameRequired: {
    id: 'pages.ContactDetails.nameRequired',
    defaultMessage: 'Please enter your Full name'
  },
  invalidEmailAddress: {
    id: 'pages.ContactDetails.invalidEmailAddress',
    defaultMessage: 'Please enter a valid email address'
  }
})

const ContactDetailsForm = props => {
  const { intl: {formatMessage}, handleSubmit, pristine, invalid,
      loading, initialValues, showNotesField, userIsAdmin, partners } = props
  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <section>
          <TextInput name="name" label={formatMessage(messages.fullName)} disabled={loading} maxLength="500" />
          <TextInput name="title" label={formatMessage(messages.jobTitle)} disabled={loading} maxLength="255" />
        </section>
        <section>
          <h1>{formatMessage(messages.emailHeader)}</h1>
          <TextInput name="email" label={formatMessage(messages.primaryEmail)} disabled={loading} maxLength="500" />
          <TextInput name="email2" label={formatMessage(messages.secondaryEmail)} disabled={loading} maxLength="500" />
        </section>
        <section>
          <h1>{formatMessage(messages.phone)}</h1>
          <PhoneInput name="phone" label={formatMessage(messages.telephone)} disabled={loading} maxLength="40" />
          <PhoneInput name="cell" label={formatMessage(messages.mobile)} disabled={loading} maxLength="40" />
        </section>
        {userIsAdmin && <section>
          <h1>{formatMessage(messages.partner)}</h1>
          <SelectInput name="lastPartnerId" label={formatMessage(messages.partner)}
                       disabled={loading || _.isEmpty(partners)} autoWidth
                       dataSource={partners} dataSourceConfig={{ text: 'name', value: 'id' }} />
        </section>}
        <section>
          <h1>{formatMessage(messages.location)}</h1>
          <LocationSelector loading={loading} initialValues={initialValues}
                            formName="accountDetails" countryIdFieldName="countryId"
                            stateIdFieldName="stateId" lgaIdFieldName="lgaId" />
          <TextInput name="zip" label={formatMessage(messages.zip)} disabled={loading} maxLength="45" />
        </section>
        {showNotesField && <section>
          <TextInput name="notes" label={formatMessage(messages.notes)} disabled={loading} maxLength="1200"
                     multiLine fullWidth rows={4} />
        </section>}
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary type="submit" />
      </div>
    </form>
  )
}

const validate = (accountDetails, props) => {
  const {formatMessage} = props.intl
  const errors = {}
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
    enableReinitialize: true,
    validate
  }))(ContactDetailsForm)
