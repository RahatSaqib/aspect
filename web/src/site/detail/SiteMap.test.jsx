import React from 'react'
import { shallow } from 'enzyme'

import SiteMap from './SiteMap'

describe('SiteMap Component', () => {
  let props
  let SiteMapWrapper

  const shallowRenderSiteMapWrapper = () => {
    SiteMapWrapper = shallow(<SiteMap {...props} />)
  }
  beforeEach(() => {
    props = {
      position: {
        lat: 41.1176358,
        lng: -81.48574129999997,
      },
    }
    shallowRenderSiteMapWrapper()
  })

  it('should shallow render correctly', () => {
    expect(SiteMapWrapper).toMatchSnapshot()
  })
})
