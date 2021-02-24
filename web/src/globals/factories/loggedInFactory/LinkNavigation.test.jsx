import React from 'react'
import Immutable from 'immutable'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { MemoryRouter } from 'react-router-dom'

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
      <MemoryRouter>
        <IntlProvider locale="en">{children}</IntlProvider>
      </MemoryRouter>
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
