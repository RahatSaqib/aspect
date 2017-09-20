import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import ChartContainer from './ChartContainer'
import ColumnChart from './ColumnChart'

describe('ColumnChart component', () => {
  const renderer = new ReactShallowRenderer()
  const data = [
    {
      name: 'newSite1',
      data: [7, 1],
    },
  ]

  const props = {
    title: 'Title',
    children: <ColumnChart data={data} />,
    alertMsg: 'Amber Alert',
    alert: 'amber',
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ChartContainer {...props} bottomTitle />)

    expect(element).toMatchSnapshot()
  })
})
