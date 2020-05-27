import React from 'react'

import { mount } from 'enzyme'
import { ResultDetailsBackBar } from './ResultDetailsBackBar'
import { DetailBackBar } from '../../globals/components/DetailBackBar'

describe('ResultDetailsBackBar component', () => {
  const props = {
    formatMessage: message => message.defaultMessage,
    history: {
      push: jest.fn(),
    },
    location: {},
    match: {
      params: {
        resultId: '1',
      },
    },
    title: 'Result',
    disabled: false,
    onBackClick: jest.fn(),
  }

  it('should render without crashing', () => {
    mount(<ResultDetailsBackBar {...props} />)
  })
  describe('ResultDetailsBackBar redirection', () => {
    it('should click back arrow and navigate back to result list', () => {
      const wrapper = mount(<ResultDetailsBackBar {...props} />)
      const {
        history: { push },
      } = props
      wrapper
        .find(ResultDetailsBackBar)
        .find(DetailBackBar)
        .find('button')
        .simulate('click')
      expect(push).toHaveBeenCalledWith('/browse/result')
    })
  })
})
