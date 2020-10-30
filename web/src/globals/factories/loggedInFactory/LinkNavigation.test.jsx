import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { LinkNavigation } from './LinkNavigation'

const extraProps = {
  onClick: () => false,
}

describe('LinkNavigation component', () => {
  const intl = createIntl({ locale: 'en' })

  it('should shallow render without crash', () => {
    const props = {
      intl,
      ...extraProps,
      userPermissions: Immutable.Set(['browse:view', 'dashboard:summary']),
    }
    shallow(<LinkNavigation {...props} />)
  })

  it('should change the direction of Nav with different `type` prop', () => {
    const props = {
      intl,
      ...extraProps,
      userPermissions: Immutable.Set(['browse:view', 'dashboard:summary']),
    }
    const wrapper = shallow(<LinkNavigation {...props} />)
    expect(wrapper.prop('className')).toEqual('Navigation')

    wrapper.setProps({ type: 'vertical' })
    expect(wrapper.hasClass('Navigation--vertical')).toBe(true)

    wrapper.setProps({ type: 'horizontal' })
    expect(wrapper.hasClass('Navigation--horizontal')).toBe(true)
  })
})
