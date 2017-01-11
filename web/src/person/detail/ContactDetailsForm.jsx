import React, { PropTypes } from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl } from 'react-intl'
import LocationSelector from '../../components/shared/LocationSelector'
import TextInput from '../../components/shared/TextInput'
import PhoneInput from '../../components/shared/PhoneInput'
import SelectInput from '../../components/shared/SelectInput'
import validateEmailAddress from '../../shared/utils/validate'
import messages from './messages'
import styles from './PersonDetail.css'

export function ContactDetailsForm({
  intl, handleSubmit, pristine, invalid,
  loading, initialValues, showNotesField, userIsAdmin, partners
}) {
  const { formatMessage } = intl
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
          <SelectInput
            name="lastPartnerId" label={formatMessage(messages.partner)}
            disabled={loading || _.isEmpty(partners)} autoWidth
            dataSource={partners} dataSourceConfig={{ text: 'name', value: 'id' }}
          />
        </section>}
        <section>
          <h1>{formatMessage(messages.location)}</h1>
          <LocationSelector
            loading={loading} initialValues={initialValues}
            formName="accountDetails" countryIdFieldName="countryId"
            stateIdFieldName="stateId" lgaIdFieldName="lgaId"
          />
          <TextInput name="zip" label={formatMessage(messages.zip)} disabled={loading} maxLength="45" />
        </section>
        {showNotesField && <section>
          <TextInput
            name="notes" label={formatMessage(messages.notes)} disabled={loading} maxLength="2000"
            multiLine fullWidth rows={4}
          />
        </section>}
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary type="submit" />
      </div>
    </form>
  )
}

ContactDetailsForm.propTypes = {
  loading: PropTypes.bool,
  partners: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    orgUnits: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      roles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      }))
    }))
  })),
  showNotesField: PropTypes.bool,
  handleSubmit: PropTypes.func.isRequired,
  intl: PropTypes.object,
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  initialValues: PropTypes.object.isRequired,
  userIsAdmin: PropTypes.bool
}

export function validate(contactDetails, props) {
  const { formatMessage } = props.intl
  const errors = {}
  if (contactDetails) {
    if (!contactDetails.get('name')) {
      errors.name = formatMessage(messages.nameRequired)
    }
    if (!validateEmailAddress(contactDetails.get('email')).optional().isValid()) {
      errors.email = formatMessage(messages.invalidEmailAddress)
    }
    if (!validateEmailAddress(contactDetails.get('email2')).optional().isValid()) {
      errors.email2 = formatMessage(messages.invalidEmailAddress)
    }
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
