import React from 'react'
import { shallow } from 'enzyme'

import { CountryMap } from './CountryMap'
import topojson from '../../../map/topo/KE.json'

describe('CountryMap component', () => {
  const props = {
    countryIsoAlpha2Code: 'KE',
    extent: [[10, 10], [290, 290]],
    loading: false,
    stroke: () => '#fff',
    fill: () => '#fff',
    projectionFunc: () => <div />,
    topojson,
  }

  it('should shallow render without crash', () => {
    shallow(<CountryMap {...props} rightLabel />)
  })
})
