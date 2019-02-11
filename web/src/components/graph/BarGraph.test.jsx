import React from 'react'
import { shallow } from 'enzyme'

import BarGraph from './BarGraph'

describe('BarGraph component', () => {
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
    color: ['#27c4e0', '#e85065'],
    spacing: 0.3,
    numLabelSize: 30,
  }

  it('should shallow render without crash', () => {
    shallow(<BarGraph {...props} />)
  })
})
