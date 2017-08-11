import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, pure } from 'recompose'
import { Dropdown } from 'react-toolbox/lib/dropdown'
import { Button } from 'react-toolbox/lib/button'

import recomposeForm from '../../components/recomposeForm'
import FlagIcon from '../../components/shared/flagIcon/FlagIcon'
import { timezones, languages } from '../../filter/hardcoded'
import messages from './messages'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

const getInitialValues = userPreferences => ({
  timezone: userPreferences.get('timezone'),
  culture: userPreferences.get('culture'),
})

const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })

      this.setState({
        onChange,
        values: getInitialValues(this.props.userPreferences),
      })
    },
    // TODO: extract state out to outer components
    componentWillReceiveProps(nextProps) {
      const { userPreferences } = nextProps
      if (this.props.userPreferences !== userPreferences) {
        // Re-initialize
        this.state.onChange(getInitialValues(userPreferences))
      }
    },
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'timezone',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'culture',
        valueFromChangeEvent: _.identity,
      },
    ],
    validate() {
      const errors = {}
      return errors
    },
  })
)

export const UserPreferencesForm = ({
  intl,
  loading,
  form,
  values,
  onTimezoneChange,
  onCultureChange,
  handleSubmit,
}) =>
  <form onSubmit={handleSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <Dropdown
        name="timezone"
        label={intl.formatMessage(messages.timezone)}
        disabled={loading || form.submitting}
        onChange={onTimezoneChange}
        labelKey="name"
        valueKey="id"
        source={timezones}
        value={values.timezone}
      />
      <Dropdown
        name="culture"
        label={intl.formatMessage(messages.language)}
        disabled={loading || form.submitting}
        onChange={onCultureChange}
        template={({
          language_name: name,
          iso_alpha2_code: countryIsoAlpha2Code,
        }) =>
          <span>
            <FlagIcon
              withRightMargin
              countryIsoAlpha2Code={countryIsoAlpha2Code}
            />
            {name}
          </span>}
        valueKey="culture"
        source={languages}
        value={values.culture}
      />
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        label={intl.formatMessage(messages.save)}
        disabled={form.pristine || !form.valid || form.loading}
        raised
        neutral
      />
    </div>
  </form>

export default enhance(UserPreferencesForm)
