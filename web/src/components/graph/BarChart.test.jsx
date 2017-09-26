import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import BarChart from './BarChart'

describe('BarChart component', () => {
  const renderer = new ReactShallowRenderer()
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

  it('should shallow render correctly', () => {
    const element = renderer.render(<BarChart {...props} />)

    expect(element).toMatchSnapshot()
  })
})
