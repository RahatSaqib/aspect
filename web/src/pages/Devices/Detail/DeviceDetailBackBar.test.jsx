import React from 'react'
import { mount } from 'enzyme'
import { DetailBackBar } from '../../../oldComponents/DetailBackBar'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { DeviceDetailBackBar } from './DeviceDetailBackBar'

describe('DeviceDetailBackBar component', () => {
  const props = {
    intl: {
      formatMessage: message => message.defaultMessage,
    },
    navigate: jest.fn(),
    location: {},
    match: {
      params: {
        deviceId: '1',
      },
    },
    title: 'Device',
    disabled: false,
  }

  it('should render without crashing', () => {
    mount(<DeviceDetailBackBar {...props} />)
  })
  describe('DeviceDetailBackBar Edit Link', () => {
    const wrapper = mount(<DeviceDetailBackBar {...props} />)

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

  describe('DeviceDetailsBackBar redirection', () => {
    it('should click back arrow and navigate back to result list', () => {
      const wrapper = mount(<DeviceDetailBackBar {...props} />)
      const { navigate } = props
      wrapper.find(DeviceDetailBackBar).find(DetailBackBar).find('button').at(0).simulate('click')

      expect(navigate).toHaveBeenCalled()
    })
  })
})
