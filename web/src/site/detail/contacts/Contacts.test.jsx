import React from 'react'
import { render } from 'enzyme'

import Contacts from './Contacts'

describe('Contacts Component', () => {
  const props = {
    id: '1',
    title: '',
    contacts: [],
    formatMessage: message => message.defaultMessage,
  }

  it('should render without crash', () => {
    render(<Contacts {...props} />)
  })
})
