import React from 'react'
import { mount } from 'enzyme'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { SiteDetailBackBar } from './SiteDetailBackBar'

describe('SiteDetailBackBar component', () => {
  const props = {
    formatMessage: message => message.defaultMessage,
    navigate: jest.fn(),
    location: {},
    match: {
      params: {
        siteId: '1',
      },
    },
    title: 'Sample Site',
    disabled: false,
  }

  it('should render without crashing', () => {
    mount(<SiteDetailBackBar {...props} />)
  })
  describe('SiteDetailBackBar Edit Link', () => {
    const wrapper = mount(<SiteDetailBackBar {...props} />)

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
})
