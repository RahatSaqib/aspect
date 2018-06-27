import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { LinkNavigation } from './LinkNavigation'

describe('LinkNavigation component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    userPermissions: Immutable.Set(['browse:view']),
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(
      <LinkNavigation {...props} userFeatures={Immutable.Set()} />
    )
    expect(element).toMatchSnapshot()
  })

  it('should see browse link when having browse feature', () => {
    const element = renderer.render(
      <LinkNavigation {...props} userFeatures={Immutable.Set(['device'])} />
    )
    expect(element).toMatchSnapshot()
  })

  it('should not see browse link when having no browse feature', () => {
    const element = renderer.render(
      <LinkNavigation {...props} userFeatures={Immutable.Set([])} />
    )
    expect(element).toMatchSnapshot()
  })
})
