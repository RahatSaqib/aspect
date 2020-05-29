import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { LinkNavigation } from './LinkNavigation'
import Link from '../../../components/shared/Link'

describe('LinkNavigation component', () => {
  const intl = createIntl({ locale: 'en' })

  it('should shallow render without crash', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view','dashboard:summary']),
    }
    shallow(<LinkNavigation {...props} />)
  })

  it('should see browse link when having permission', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(),
    }
    const wrapper = shallow(<LinkNavigation {...props} />)

    expect(wrapper.find(Link)).toHaveLength(0)

    wrapper.setProps({
      userPermissions: Immutable.Set(['browse:view', 'device:view','dashboard:summary']),

    })
    expect(wrapper.find(Link)).toHaveLength(1)
    expect(
      wrapper.find(Link).someWhere(L => /^\/browse/.test(L.prop('href')))
    ).toBe(false)

    wrapper.setProps({
      userPermissions: Immutable.Set(['dashboard:summary', 'device:view']),
    })
    expect(wrapper.find(Link)).toHaveLength(2)
    expect(
      wrapper.find(Link).someWhere(L => /^\/browse/.test(L.prop('href')))
    ).toBe(true)
  })

  it('should change the direction of Nav with different `type` prop', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view','dashboard:summary']),
    }
    const wrapper = shallow(<LinkNavigation {...props} />)
    expect(wrapper.prop('className')).toEqual('Navigation')

    wrapper.setProps({ type: 'vertical' })
    expect(wrapper.hasClass('Navigation--vertical')).toBe(true)

    wrapper.setProps({ type: 'horizontal' })
    expect(wrapper.hasClass('Navigation--horizontal')).toBe(true)
  })
})
