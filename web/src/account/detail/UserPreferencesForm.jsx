import React from 'react'
import { reduxForm } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import SelectInput from '../../components/shared/SelectInput'
import CountrySelect from '../../components/shared/CountrySelect'
import styles from './AccountDetails.css'

const messages = defineMessages({
  timezone: {
    id: 'pages.UserPreferences.timezone',
    defaultMessage: 'Time Zone'
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

const renderLanguageField = props => {
  const {input} = props,
    onChange = (event, index, value) => {
      input.onChange(value)
    }
  return (
    <CountrySelect name={input.name} dataSource={languages}
                   dataSourceConfig={{
                     selectedItemTextPredicate: language => language.language_name,
                     menuItemTextPredicate: language => language.language_name,
                     valuePredicate: language => language.culture
                   }}
                   selectFieldStyle={{verticalAlign: 'bottom'}}
                   onChange={onChange} />
  )
}

const UserPreferencesForm = props => {
  const { handleSubmit, pristine, invalid, loading, saving, timezoneFieldName, cultureFieldName } = props,
    {formatMessage} = props.intl
  const timezoneDataSourceConfig = { text: 'name', value: 'value' }

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <SelectInput name={timezoneFieldName} label={formatMessage(messages.timezone)}
                     disabled={loading || saving}
                     dataSource={timezones} dataSourceConfig={timezoneDataSourceConfig} />
        <br />
        <Field name={cultureFieldName} floatingLabelText={formatMessage(messages.language)}
               disabled={loading || saving} component={renderLanguageField}  />
      </div>
      <div className={styles.Form__ActionRow}>
        <RaisedButton disabled={pristine || invalid || loading} label={formatMessage(messages.save)} secondary={true} type="button" />
      </div>
    </form>
  )
}

export default _.flowRight(
  injectIntl,
  reduxForm({
    form: 'userPreferences'
  }))(UserPreferencesForm)

const timezones = [{ value: 'Dateline Standard Time', name: '(UTC-12:00) International Date Line West' },
  { value: 'UTC-11', name: '(UTC-11:00) Coordinated Universal Time-11' },
  { value: 'Hawaiian Standard Time', name: '(UTC-10:00) Hawaii' },
  { value: 'Alaskan Standard Time', name: '(UTC-09:00) Alaska' },
  { value: 'Pacific Standard Time (Mexico)', name: '(UTC-08:00) Baja California' },
  { value: 'Pacific Standard Time', name: '(UTC-08:00) Pacific Time (US &amp; Canada)' },
  { value: 'US Mountain Standard Time', name: '(UTC-07:00) Arizona' },
  { value: 'Mountain Standard Time (Mexico)', name: '(UTC-07:00) Chihuahua, La Paz, Mazatlan' },
  { value: 'Mountain Standard Time', name: '(UTC-07:00) Mountain Time (US &amp; Canada)' },
  { value: 'Central America Standard Time', name: '(UTC-06:00) Central America' },
  { value: 'Central Standard Time', name: '(UTC-06:00) Central Time (US &amp; Canada)' },
  { value: 'Central Standard Time (Mexico)', name: '(UTC-06:00) Guadalajara, Mexico City, Monterrey' },
  { value: 'Canada Central Standard Time', name: '(UTC-06:00) Saskatchewan' },
  { value: 'SA Pacific Standard Time', name: '(UTC-05:00) Bogota, Lima, Quito' },
  { value: 'Eastern Standard Time', name: '(UTC-05:00) Eastern Time (US &amp; Canada)' },
  { value: 'US Eastern Standard Time', name: '(UTC-05:00) Indiana (East)' },
  { value: 'Venezuela Standard Time', name: '(UTC-04:30) Caracas' },
  { value: 'Paraguay Standard Time', name: '(UTC-04:00) Asuncion' },
  { value: 'Atlantic Standard Time', name: '(UTC-04:00) Atlantic Time (Canada)' },
  { value: 'Central Brazilian Standard Time', name: '(UTC-04:00) Cuiaba' },
  { value: 'SA Western Standard Time', name: '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan' },
  { value: 'Pacific SA Standard Time', name: '(UTC-04:00) Santiago' },
  { value: 'Newfoundland Standard Time', name: '(UTC-03:30) Newfoundland' },
  { value: 'E. South America Standard Time', name: '(UTC-03:00) Brasilia' },
  { value: 'Argentina Standard Time', name: '(UTC-03:00) Buenos Aires' },
  { value: 'SA Eastern Standard Time', name: '(UTC-03:00) Cayenne, Fortaleza' },
  { value: 'Greenland Standard Time', name: '(UTC-03:00) Greenland' },
  { value: 'Montevideo Standard Time', name: '(UTC-03:00) Montevideo' },
  { value: 'Bahia Standard Time', name: '(UTC-03:00) Salvador' },
  { value: 'UTC-02', name: '(UTC-02:00) Coordinated Universal Time-02' },
  { value: 'Mid-Atlantic Standard Time', name: '(UTC-02:00) Mid-Atlantic' },
  { value: 'Azores Standard Time', name: '(UTC-01:00) Azores' },
  { value: 'Cape Verde Standard Time', name: '(UTC-01:00) Cape Verde Is.' },
  { value: 'Morocco Standard Time', name: '(UTC) Casablanca' },
  { value: 'UTC', name: '(UTC) Coordinated Universal Time' },
  { value: 'GMT Standard Time', name: '(UTC) Dublin, Edinburgh, Lisbon, London' },
  { value: 'Greenwich Standard Time', name: '(UTC) Monrovia, Reykjavik' },
  { value: 'W. Europe Standard Time', name: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' },
  { value: 'Central Europe Standard Time', name: '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague' },
  { value: 'Romance Standard Time', name: '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris' },
  { value: 'Central European Standard Time', name: '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb' },
  { value: 'W. Central Africa Standard Time', name: '(UTC+01:00) West Central Africa' },
  { value: 'Namibia Standard Time', name: '(UTC+01:00) Windhoek' },
  { value: 'Jordan Standard Time', name: '(UTC+02:00) Amman' },
  { value: 'GTB Standard Time', name: '(UTC+02:00) Athens, Bucharest' },
  { value: 'Middle East Standard Time', name: '(UTC+02:00) Beirut' },
  { value: 'Egypt Standard Time', name: '(UTC+02:00) Cairo' },
  { value: 'Syria Standard Time', name: '(UTC+02:00) Damascus' },
  { value: 'South Africa Standard Time', name: '(UTC+02:00) Harare, Pretoria' },
  { value: 'FLE Standard Time', name: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' },
  { value: 'Turkey Standard Time', name: '(UTC+02:00) Istanbul' },
  { value: 'Israel Standard Time', name: '(UTC+02:00) Jerusalem' },
  { value: 'E. Europe Standard Time', name: '(UTC+02:00) Nicosia' },
  { value: 'Arabic Standard Time', name: '(UTC+03:00) Baghdad' },
  { value: 'Kaliningrad Standard Time', name: '(UTC+03:00) Kaliningrad, Minsk' },
  { value: 'Arab Standard Time', name: '(UTC+03:00) Kuwait, Riyadh' },
  { value: 'E. Africa Standard Time', name: '(UTC+03:00) Nairobi' },
  { value: 'Iran Standard Time', name: '(UTC+03:30) Tehran' },
  { value: 'Arabian Standard Time', name: '(UTC+04:00) Abu Dhabi, Muscat' },
  { value: 'Azerbaijan Standard Time', name: '(UTC+04:00) Baku' },
  { value: 'Russian Standard Time', name: '(UTC+04:00) Moscow, St. Petersburg, Volgograd' },
  { value: 'Mauritius Standard Time', name: '(UTC+04:00) Port Louis' },
  { value: 'Georgian Standard Time', name: '(UTC+04:00) Tbilisi' },
  { value: 'Caucasus Standard Time', name: '(UTC+04:00) Yerevan' },
  { value: 'Afghanistan Standard Time', name: '(UTC+04:30) Kabul' },
  { value: 'Pakistan Standard Time', name: '(UTC+05:00) Islamabad, Karachi' },
  { value: 'West Asia Standard Time', name: '(UTC+05:00) Tashkent' },
  { value: 'India Standard Time', name: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'Sri Lanka Standard Time', name: '(UTC+05:30) Sri Jayawardenepura' },
  { value: 'Nepal Standard Time', name: '(UTC+05:45) Kathmandu' },
  { value: 'Central Asia Standard Time', name: '(UTC+06:00) Astana' },
  { value: 'Bangladesh Standard Time', name: '(UTC+06:00) Dhaka' },
  { value: 'Ekaterinburg Standard Time', name: '(UTC+06:00) Ekaterinburg' },
  { value: 'Myanmar Standard Time', name: '(UTC+06:30) Yangon (Rangoon)' },
  { value: 'SE Asia Standard Time', name: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'N. Central Asia Standard Time', name: '(UTC+07:00) Novosibirsk' },
  { value: 'China Standard Time', name: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
  { value: 'North Asia Standard Time', name: '(UTC+08:00) Krasnoyarsk' },
  { value: 'Singapore Standard Time', name: '(UTC+08:00) Kuala Lumpur, Singapore' },
  { value: 'W. Australia Standard Time', name: '(UTC+08:00) Perth' },
  { value: 'Taipei Standard Time', name: '(UTC+08:00) Taipei' },
  { value: 'Ulaanbaatar Standard Time', name: '(UTC+08:00) Ulaanbaatar' },
  { value: 'North Asia East Standard Time', name: '(UTC+09:00) Irkutsk' },
  { value: 'Tokyo Standard Time', name: '(UTC+09:00) Osaka, Sapporo, Tokyo' },
  { value: 'Korea Standard Time', name: '(UTC+09:00) Seoul' },
  { value: 'Cen. Australia Standard Time', name: '(UTC+09:30) Adelaide' },
  { value: 'AUS Central Standard Time', name: '(UTC+09:30) Darwin' },
  { value: 'E. Australia Standard Time', name: '(UTC+10:00) Brisbane' },
  { value: 'AUS Eastern Standard Time', name: '(UTC+10:00) Canberra, Melbourne, Sydney' },
  { value: 'West Pacific Standard Time', name: '(UTC+10:00) Guam, Port Moresby' },
  { value: 'Tasmania Standard Time', name: '(UTC+10:00) Hobart' },
  { value: 'Yakutsk Standard Time', name: '(UTC+10:00) Yakutsk' },
  { value: 'Central Pacific Standard Time', name: '(UTC+11:00) Solomon Is., New Caledonia' },
  { value: 'Vladivostok Standard Time', name: '(UTC+11:00) Vladivostok' },
  { value: 'New Zealand Standard Time', name: '(UTC+12:00) Auckland, Wellington' },
  { value: 'UTC+12', name: '(UTC+12:00) Coordinated Universal Time+12' },
  { value: 'Fiji Standard Time', name: '(UTC+12:00) Fiji' },
  { value: 'Magadan Standard Time', name: '(UTC+12:00) Magadan' },
  { value: 'Kamchatka Standard Time', name: '(UTC+12:00) Petropavlovsk-Kamchatsky - Old' },
  { value: 'Tonga Standard Time', name: '(UTC+13:00) Nuku\'alofa' },
  { value: 'Samoa Standard Time', name: '(UTC+13:00) Samoa' }]

const languages = [{culture: 'fr-FR', language_name: 'French (FR)', iso_alpha2_code: 'FR'},
  {culture: 'en-US', language_name: 'English (US)', iso_alpha2_code: 'US'}]
