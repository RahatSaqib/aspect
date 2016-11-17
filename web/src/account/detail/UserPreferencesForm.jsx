import React from 'react'
import { reduxForm, Field } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import TimezoneSelect from '../../components/shared/TimezoneSelect'
import CountrySelect from '../../components/shared/CountrySelect'
import styles from './AccountDetails.css'

const messages = defineMessages({
  timezone: {
    id: 'pages.UserPreferences.timezone',
    defaultMessage: 'Time Zone'
  },
  useDeviceTimezone: {
    id: 'pages.UserPreferences.useDeviceTimezone',
    defaultMessage: 'Use Computer\'s Time Zone'
  },
  language: {
    id: 'pages.UserPreferences.language',
    defaultMessage: 'Language'
  },
  save: {
    id: 'pages.UserPreferences.save',
    defaultMessage: 'Save'
  }
})

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

const UserPreferencesForm = (props) => {
  const { handleSubmit, pristine, invalid, loading, saving } = props
  const { formatMessage } = props.intl

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <TimezoneSelect
          name="timezone" label={formatMessage(messages.timezone)}
          disabled={loading || saving} autoWidth
          defaultTimezoneText={formatMessage(messages.useDeviceTimezone)}
        />
        <br />
        <Field
          name="culture" floatingLabelText={formatMessage(messages.language)}
          selectFieldProps={{
            floatingLabelText: formatMessage(messages.language),
            disabled: (loading || saving),
            autoWidth: true
          }}
          disabled={loading || saving} component={renderLanguageField}
        />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary type="submit" />
      </div>
    </form>
  )
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'userPreferences'
  }))(UserPreferencesForm)

const languages = [{ culture: 'fr-FR', language_name: 'French (FR)', iso_alpha2_code: 'FR' },
  { culture: 'en-US', language_name: 'English (US)', iso_alpha2_code: 'US' }]
