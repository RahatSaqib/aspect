import React from 'react'
import { shallow } from 'enzyme'

import SiteMap from './Detail/SiteMap'

describe('SiteMap Component', () => {
  const props = {
    position: {
      lat: 41.1176358,
      lng: -81.48574129999997,
    },
  }

  it('should shallow render without crash', () => {
    shallow(<SiteMap {...props} />)
  })
})
