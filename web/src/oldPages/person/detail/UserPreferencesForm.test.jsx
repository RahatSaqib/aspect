import React from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { shallow } from 'enzyme'
import noop from 'lodash/noop'

describe('UserPreferencesForm module', () => {
  const { UserPreferencesForm } = require('./UserPreferencesForm')
  const props = {
    intl: {
      formatMessage: message => message.defaultMessage,
    },
    loading: false,
    form: {
      pristine: true,
      valid: false,
      submitting: false,
    },
    values: {},
    onTimezoneChange: noop,
    onCultureChange: noop,
    handleSubmit: noop,
  }

  describe('UserPreferencesForm component', () => {
    it('should shallow render without crash', () => {
      shallow(<UserPreferencesForm {...props} />)
    })

    it('should disable all fields when form is loading', () => {
      const wrapper = shallow(<UserPreferencesForm {...props} loading />)
      const results = wrapper.find(TextField)
      expect(results).toHaveLength(2)
      results.forEach(w => expect(w.prop('disabled')).toBe(true))
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const wrapper = shallow(
        <UserPreferencesForm
          {...props}
          form={{
            pristine: false,
            valid: true,
            submitting: false,
          }}
        />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeFalsy()
    })
  })
})
