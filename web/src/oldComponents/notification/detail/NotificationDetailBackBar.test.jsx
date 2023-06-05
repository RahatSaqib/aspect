import React from 'react'
import { mount } from 'enzyme'
import { DetailBackBar } from '../../DetailBackBar'
import { NotificationDetailBackBar } from './NotificationDetailBackBar'

describe('NotificationDetailBackBar component', () => {
  const props = {
    intl: {
      formatMessage: message => message.defaultMessage,
    },
    onBackClick: jest.fn(),
    navigate: jest.fn(),
    location: {},
    match: {
      params: {
        notificationId: '1',
      },
    },
    title: 'Notification',
    disabled: false,
  }

  it('should render without crashing', () => {
    mount(<NotificationDetailBackBar {...props} />)
  })

  describe('Page Redirection', () => {
    it('should redirect the page to notification list', () => {
      const wrapper = mount(<NotificationDetailBackBar {...props} />)
      const { onBackClick } = props

      expect(onBackClick).toHaveBeenCalledTimes(0)

      wrapper.find(NotificationDetailBackBar).find(DetailBackBar).find('button').at(0).simulate('click')

      expect(onBackClick).toHaveBeenCalledTimes(1)
    })
  })
})
