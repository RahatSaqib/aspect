import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

describe('UserPreferencesForm module', () => {
  const { UserPreferencesForm } = require('./UserPreferencesForm')

  describe('UserPreferencesForm component', () => {
    const renderer = new ReactShallowRenderer()
    let props

    beforeEach(() => {
      props = {
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
        onTimezoneChange: () => {},
        onCultureChange: () => {},
        handleSubmit: () => {},
      }
    })

    it('should shallow render correctly', () => {
      const element = renderer.render(<UserPreferencesForm {...props} />)

      expect(element).toMatchSnapshot()
    })

    it('should disable all fields when form is loading', () => {
      const element = renderer.render(
        <UserPreferencesForm {...props} loading />
      )

      expect(element).toMatchSnapshot()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const element = renderer.render(
        <UserPreferencesForm
          {...props}
          form={{
            pristine: false,
            valid: true,
            submitting: false,
          }}
        />
      )
      expect(element).toMatchSnapshot()
    })
  })
})
