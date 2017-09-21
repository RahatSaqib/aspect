import _ from 'lodash'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { Login } from './Login'

describe('Login component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    onUserChange: _.noop,
    onPasswordChange: _.noop,
    handleSubmit: _.noop,
    values: { user: '', password: '' },
    meta: {
      user: { touched: '', error: '' },
      password: { touched: '', error: '' },
    },
    form: {
      valid: true,
      submitting: false,
    },
  }
  const LoginComponent = <Login {...props} />

  it('should shallow render correctly', () => {
    const element = renderer.render(LoginComponent)

    expect(element).toMatchSnapshot()
  })
})
