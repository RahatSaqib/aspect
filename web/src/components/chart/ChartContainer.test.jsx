import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import ChartContainer from './ChartContainer'
import ColumnGraph from '../graph/ColumnGraph'

describe('ColumnGraph component', () => {
  const renderer = new ReactShallowRenderer()
  const data = [
    {
      name: 'newSite1',
      data: [7, 1],
    },
  ]

  const props = {
    title: 'Title',
    children: <ColumnGraph data={data} />,
    alertMsg: 'Amber Alert',
    alert: 'amber',
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ChartContainer {...props} bottomTitle />)

    expect(element).toMatchSnapshot()
  })
})
