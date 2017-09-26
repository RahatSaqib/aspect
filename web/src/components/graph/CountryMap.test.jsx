import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import { CountryMap } from './CountryMap'
import topojson from '../../../map/topo/KE.json'

describe('CountryMap component', () => {
  const renderer = new ReactShallowRenderer()
  const props = {
    countryIsoAlpha2Code: 'KE',
    extent: [[10, 10], [290, 290]],
    loading: false,
    topojson,
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<CountryMap {...props} rightLabel />)

    expect(element).toMatchSnapshot()
  })
})
