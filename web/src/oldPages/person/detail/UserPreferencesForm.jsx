import React from 'react'
import { Button, MenuItem, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import { compose, lifecycle, pure } from 'recompose'
import { timezones, languages } from '../../../oldComponents/filter/hardcoded'
import recomposeForm from '../../../oldComponents/recomposeForm'
import FlagIcon from '../../../oldComponents/shared/flagIcon/FlagIcon'
import messages from './messages'
import styles from './PersonDetail.css'

const cssClasses = classnames.bind(styles)

const getInitialValues = userPreferences => ({
  timezone: userPreferences.get('timezone'),
  culture: userPreferences.get('culture'),
})

const enhance = compose(
  pure,
  lifecycle({
    UNSAFE_componentWillMount() {
      const onChange = values => this.setState({ values })

      this.setState({
        onChange,
        values: getInitialValues(this.props.userPreferences),
      })
    },
    // TODO: extract state out to outer components
    UNSAFE_componentWillReceiveProps(nextProps) {
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
              <FlagIcon withRightMargin countryIsoAlpha2Code={item.isoAlpha2Code} />
              {item.languageName}
            </span>
          </MenuItem>
        ))}
      </TextField>
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        disabled={form.pristine || !form.valid || form.submitting}
        color="primary"
        variant="contained"
      >
        {intl.formatMessage(messages.save)}
      </Button>
    </div>
  </form>
)

export default enhance(UserPreferencesForm)
