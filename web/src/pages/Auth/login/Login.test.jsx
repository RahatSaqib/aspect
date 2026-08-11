import React from 'react'
import { render, screen } from '@testing-library/react'
import noop from 'lodash/noop'
import { createIntl, IntlProvider } from 'react-intl'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'

describe('Login component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    onUserChange: noop,
    onPasswordChange: noop,
    handleSubmit: noop,
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

  const renderLogin = (overrides = {}) => {
    const { rerender, ...rest } = render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <Login {...props} {...overrides} />
        </MemoryRouter>
      </IntlProvider>
    )

    return {
      ...rest,
      rerenderLogin: nextOverrides =>
        rerender(
          <IntlProvider locale="en">
            <MemoryRouter>
              <Login {...props} {...nextOverrides} />
            </MemoryRouter>
          </IntlProvider>
        ),
    }
  }

  it('should render without crash', () => {
    renderLogin()

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show `LinearProgress` when the form is submitting', () => {
    const { rerenderLogin } = renderLogin()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    rerenderLogin({ form: { valid: true, submitting: true } })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should disable the button when the form is invalid', () => {
    const { rerenderLogin } = renderLogin()
    expect(screen.getByRole('button')).toBeEnabled()

    rerenderLogin({ form: { valid: false, submitting: false } })
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
