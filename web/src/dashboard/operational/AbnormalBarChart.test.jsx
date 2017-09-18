import React from 'react'
import { shallow } from 'enzyme'

import AbnormalBarChart from './AbnormalBarChart'

describe('AbnormalBarChart Component', () => {
  let props
  let AbnormalBarChartWrapper

  const shallowRenderAbnormalBarChart = () => {
    AbnormalBarChartWrapper = shallow(<AbnormalBarChart {...props} />)
  }
  beforeEach(() => {
    props = {
      data: [
        {
          id: '1',
          value: 3,
          abnormal: false,
        },
      ],
      x: it => it.id,
      y: it => it.value,
      fill: it => (it.abnormal ? '#EA4E62' : '#36DED6'),
    }
    shallowRenderAbnormalBarChart()
  })

  it('should shallow render correctly', () => {
    expect(AbnormalBarChartWrapper).toMatchSnapshot()
  })
})
