import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import { LinkNavigation } from './LinkNavigation'
import Link from '../../../components/shared/Link'

describe('LinkNavigation component', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  it('should shallow render without crash', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view']),
      userFeatures: Immutable.Set(['summaryDashboard']),
    }
    shallow(<LinkNavigation {...props} />)
  })

  it('should see browse link when having feature and permission', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(),
      userFeatures: Immutable.Set(),
    }
    const wrapper = shallow(<LinkNavigation {...props} />)

    expect(wrapper.find(Link)).toHaveLength(0)

    wrapper.setProps({
      userPermissions: Immutable.Set(['browse:view', 'device:view']),
      userFeatures: Immutable.Set(['summaryDashboard']),
    })
    expect(wrapper.find(Link)).toHaveLength(1)
    expect(
      wrapper.find(Link).someWhere(L => /^\/browse/.test(L.prop('href')))
    ).toBe(false)

    wrapper.setProps({
      userFeatures: Immutable.Set(['summaryDashboard', 'device']),
    })
    expect(wrapper.find(Link)).toHaveLength(2)
    expect(
      wrapper.find(Link).someWhere(L => /^\/browse/.test(L.prop('href')))
    ).toBe(true)
  })

  it('should change the direction of Nav with different `type` prop', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view']),
      userFeatures: Immutable.Set(['summaryDashboard']),
    }
    const wrapper = shallow(<LinkNavigation {...props} />)
    expect(wrapper.prop('className')).toEqual('Navigation')

    wrapper.setProps({ type: 'vertical' })
    expect(wrapper.hasClass('Navigation--vertical')).toBe(true)

    wrapper.setProps({ type: 'horizontal' })
    expect(wrapper.hasClass('Navigation--horizontal')).toBe(true)
  })
})
