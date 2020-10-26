import React from 'react'
import { shallow } from 'enzyme'

import ColumnGraph from './ColumnGraph'

describe('ColumnGraph component', () => {
  const { '--aspect-color-mantis': colorMantis } = process.env
  const props = {
    data: [
      {
        name: 'newSite1',
        data: [7, 1],
      },
      {
        name: 'newSite2',
        data: [6, 1.5],
      },
      {
        name: 'newSite3',
        data: [4, 1],
      },
      {
        name: 'newSite4',
        data: [9, 1],
      },
    ],
    color: ['#e85164', '#fcb124', colorMantis],
    spacing: 0.4,
    hideAxes: false,
    hideLabel: false,
  }

  it('should shallow render without crash', () => {
    shallow(<ColumnGraph {...props} rightLabel />)
  })
})
