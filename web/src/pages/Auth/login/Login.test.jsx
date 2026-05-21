import React from 'react'
import { Button, LinearProgress } from '@mui/material'
import { shallow } from 'enzyme'
import noop from 'lodash/noop'
import { createIntl } from 'react-intl'
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

  it('should shallow render without crash', () => {
    shallow(<Login {...props} />)
  })

  it('should show `LinearProgress` when the form is submitting', () => {
    const wrapper = shallow(<Login {...props} />)
    expect(wrapper.find(LinearProgress)).toHaveLength(0)

    wrapper.setProps({ form: { submitting: true } })
    expect(wrapper.find(LinearProgress)).toHaveLength(1)
  })

  it('should disable the button when the form is invalid', () => {
    const wrapper = shallow(<Login {...props} />)
    expect(wrapper.find(Button).prop('disabled')).toBeFalsy()

    wrapper.setProps({ form: { valid: false } })
    expect(wrapper.find(Button).prop('disabled')).toBe(true)
  })
})
