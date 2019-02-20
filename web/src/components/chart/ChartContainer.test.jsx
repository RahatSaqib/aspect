import React from 'react'
import { shallow } from 'enzyme'

import ChartContainer from './ChartContainer'
import ColumnGraph from '../graph/ColumnGraph'
import Alert from './ChartAlert'

describe('ColumnGraph component', () => {
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

  it('should shallow render without crash', () => {
    shallow(<ChartContainer {...props} bottomTitle />)
  })

  it('should render a title at top if no `bottomTitle` prop is given', () => {
    const wrapper = shallow(<ChartContainer {...props} />)
    expect(wrapper.find('h1')).toHaveLength(1)
    expect(wrapper.childAt(0).name()).toEqual('h1')
  })

  it('should render a title at bottom if `bottomTitle` prop is given', () => {
    const wrapper = shallow(<ChartContainer {...props} bottomTitle />)
    expect(wrapper.find('h1')).toHaveLength(1)
    expect(wrapper.childAt(0).name()).toEqual('ColumnGraph')
  })

  it('should render a `Alert` when `alertMsg` is given', () => {
    const wrapper = shallow(<ChartContainer {...props} alertMsg={undefined} />)
    expect(wrapper.find(Alert)).toHaveLength(0)

    wrapper.setProps({ alertMsg: props.alertMsg })
    expect(wrapper.find(Alert)).toHaveLength(1)
  })
})
