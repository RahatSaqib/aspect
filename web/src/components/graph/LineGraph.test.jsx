import React from 'react'
import { shallow } from 'enzyme'

import LineGraph from './LineGraph'

describe('LineGraph component', () => {
  const { '--aspect-color-conifer': colorConifer } = process.env
  const props = {
    data: [
      { date: 'Site 1', value: [1, 2, 8] },
      { date: 'Site 2', value: [2, 4, 9] },
      { date: 'Site 3', value: [3, 9, 8] },
      { date: 'Site 4', value: [1, 4, 7] },
      { date: 'Site 5', value: [2, 1, 6] },
      { date: 'Site 6', value: [3, 4, 5] },
      { date: 'Site 7', value: [1, 1, 5] },
      { date: 'Site 8', value: [2, 3, 8] },
    ],
    color: ['#e85164', '#fcb124', colorConifer],
    lineSize: 0.4,
    numYTicks: 3,
    hideLabel: false,
  }

  it('should shallow render without crash', () => {
    shallow(<LineGraph {...props} gridLines timeStyle />)
  })
})
