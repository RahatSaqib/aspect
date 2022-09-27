import React from 'react'
import { render, screen } from '@testing-library/react'
import Immutable from 'immutable'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import '@testing-library/jest-dom/extend-expect'
import { MemoryRouter } from 'react-router-dom'
import { createStore } from 'redux'
import { AuthProvider } from '../../providers/AuthProvider'
import { I18nProvider } from '../../providers/I18nProvider'
import { LinkNavigation } from './LinkNavigation'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

describe('LinkNavigation', () => {
  const User = Immutable.Record({
    jwt: { permissions: ['browse:view', 'dashboard:summary'] },
  })
  const reduxState = { user: new User() }
  const store = createStore(reducer, reduxState || initialState)
  const defaultProps = {
    onClick: () => false,
  }

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <I18nProvider>
        <AuthProvider>
          <MemoryRouter>
            <IntlProvider locale="en">{children}</IntlProvider>
          </MemoryRouter>
        </AuthProvider>
      </I18nProvider>
    </Provider>
  )

  it('should change the direction of Nav with different `type` prop', () => {
    const { rerender } = render(
      <Wrapper>
        <LinkNavigation {...defaultProps} type="horizontal" />
      </Wrapper>
    )
    expect(screen.getByRole('navigation')).toHaveClass('Navigation--horizontal')

    rerender(
      <Wrapper>
        <LinkNavigation {...defaultProps} type="vertical" />
      </Wrapper>
    )
    expect(screen.getByRole('navigation')).toHaveClass('Navigation--vertical')
  })
})
