import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import ColumnChart from './ColumnChart'

describe('ColumnChart component', () => {
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
    color: ['#e85164', '#fcb124', '#73d449'],
    spacing: 0.4,
    hideAxes: false,
    hideLabel: false,
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ColumnChart {...props} rightLabel />)

    expect(element).toMatchSnapshot()
  })
})
