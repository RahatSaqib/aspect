import React from 'react'
import { mount } from 'enzyme'
import Button from '@material-ui/core/Button'
import Contacts from './Contacts'

describe('Contacts Component', () => {
  const props = {
    id: '1',
    title: '',
    contacts: [],
    formatMessage: message => message.defaultMessage,
  }

  it('should render without crash', () => {
    mount(<Contacts {...props} />)
  })

  it('should have disabled button if user has no edit rights', () => {
    const wrapper = mount(<Contacts {...props} />)
    wrapper.setProps({ disabled: true })
    expect(wrapper.find(Button).prop('disabled')).toBe(true)
  })
})
