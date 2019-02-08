import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, pure } from 'recompose'
import Button from '@material-ui/core/Button'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'

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
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'culture',
        valueFromChangeEvent: it => it.target.value,
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
}) => (
  <form onSubmit={handleSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <TextField
        select
        fullWidth
        id="timezone"
        name="timezone"
        label={intl.formatMessage(messages.timezone)}
        disabled={loading || form.submitting}
        onChange={onTimezoneChange}
        value={values.timezone}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      >
        {timezones.map(item => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        id="culture"
        name="culture"
        label={intl.formatMessage(messages.language)}
        disabled={loading || form.submitting}
        onChange={onCultureChange}
        value={values.culture}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      >
        {languages.map(item => (
          <MenuItem key={item.culture} value={item.culture}>
            <span>
              <FlagIcon
                withRightMargin
                countryIsoAlpha2Code={item.iso_alpha2_code}
              />
              {item.language_name}
            </span>
          </MenuItem>
        ))}
      </TextField>
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        disabled={form.pristine || !form.valid || form.loading}
        color="primary"
        variant="contained"
      >
        {intl.formatMessage(messages.save)}
      </Button>
    </div>
  </form>
)

export default enhance(UserPreferencesForm)
