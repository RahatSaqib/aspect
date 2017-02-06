import React, { PropTypes } from 'react'
import { reduxForm, Field } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, intlShape } from 'react-intl'
import TimezoneSelect from '../../components/shared/TimezoneSelect'
import CountrySelect from '../../components/shared/CountrySelect'
import messages from './messages'
import styles from './PersonDetail.css'

const renderLanguageField = (props) => {
  const { onSelectionChanged, input, selectFieldProps } = props
  const onChange = (event, index, value) => {
    if (onSelectionChanged) {
      onSelectionChanged(event, index, value)
    }
    input.onChange(value)
  }
  return (
    <CountrySelect
      name={input.name} value={input.value} dataSource={languages}
      dataSourceConfig={{
        selectedItemTextPredicate: language => language.language_name,
        menuItemTextPredicate: language => language.language_name,
        valuePredicate: language => language.culture
      }} selectFieldProps={selectFieldProps} onChange={onChange}
    />
  )
}

export function UserPreferencesForm({
  intl, handleSubmit, pristine, invalid, loading, saving
}) {
  const { formatMessage } = intl

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <TimezoneSelect
          name="timezone" label={formatMessage(messages.timezone)}
          disabled={loading || saving} autoWidth
        />
        <br />
        <Field
          name="culture" selectFieldProps={{
            floatingLabelText: formatMessage(messages.language),
            disabled: (loading || saving),
            autoWidth: true
          }} disabled={loading || saving} component={renderLanguageField}
        />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary type="submit" />
      </div>
    </form>
  )
}

UserPreferencesForm.propTypes = {
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  intl: intlShape.isRequired
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    enableReinitialize: true,
    form: 'userPreferences'
  }))(UserPreferencesForm)

const languages = [{ culture: 'fr-FR', language_name: 'French (FR)', iso_alpha2_code: 'FR' },
  { culture: 'en-US', language_name: 'English (US)', iso_alpha2_code: 'US' }]
