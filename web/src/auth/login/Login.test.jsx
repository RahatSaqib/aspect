import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'

import Login from './Login'
import store from '../../store'

describe('Login component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
  }
  const LoginComponent = (
    <Provider store={store}>
      <Login {...props} />
    </Provider>
  )

  it('should shallow render correctly', () => {
    const element = renderer.render(LoginComponent)

    expect(element).toMatchSnapshot()
  })
})
