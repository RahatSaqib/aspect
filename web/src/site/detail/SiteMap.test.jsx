import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import SiteMap from './SiteMap'

describe('SiteMap Component', () => {
  const renderer = new ReactShallowRenderer()

  const props = {
    position: {
      lat: 41.1176358,
      lng: -81.48574129999997,
    },
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<SiteMap {...props} />)
    expect(element).toMatchSnapshot()
  })
})
