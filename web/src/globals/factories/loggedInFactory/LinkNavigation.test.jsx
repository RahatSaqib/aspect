import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { LinkNavigation } from './LinkNavigation'

describe('LinkNavigation component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  it('should shallow render correctly', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view']),
      userFeatures: Immutable.Set(['summaryDashboard']),
    }
    const element = renderer.render(<LinkNavigation {...props} />)
    expect(element).toMatchSnapshot()
  })

  it('should see browse link when having feature and permission', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view', 'device:view']),
      userFeatures: Immutable.Set(['summaryDashboard', 'device']),
    }
    const element = renderer.render(<LinkNavigation {...props} />)
    expect(element).toMatchSnapshot()
  })

  it('should not see browse link when having no device feature', () => {
    const props = {
      intl,
      userPermissions: Immutable.Set(['browse:view', 'device:view']),
      userFeatures: Immutable.Set(['summaryDashboard']),
    }
    const element = renderer.render(<LinkNavigation {...props} />)
    expect(element).toMatchSnapshot()
  })
})
