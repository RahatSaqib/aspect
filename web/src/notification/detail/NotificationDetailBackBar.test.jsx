import React from 'react'
import { mount } from 'enzyme'
import { NotificationDetailBackBar } from './NotificationDetailBackBar'
import AspectButton from '../../components/shared/AspectButton'
import { DetailBackBar } from '../../globals/components/DetailBackBar'

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
  describe.skip('NotificationDetailBackBar Edit Link', () => {
    const wrapper = mount(<NotificationDetailBackBar {...props} />)

    it("should  have active 'Edit' link if user has edit rights", () => {
      const editLink = wrapper.find(AspectButton).filterWhere(link => link.text() === 'Edit')
      expect(editLink.prop('disabled')).toBe(false)
    })

    it("should disable 'Edit' link if user has no edit rights", () => {
      wrapper.setProps({ disabled: true })
      const editLink = wrapper.find(AspectButton).filterWhere(n => n.text() === 'Edit')
      expect(editLink.prop('disabled')).toBe(true)
    })
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
