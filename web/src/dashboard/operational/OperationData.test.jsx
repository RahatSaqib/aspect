import Immutable from 'Immutable'
import React from 'react'
import { shallow } from 'enzyme'

import { OperationalData } from './OperationalData'

describe('OperationData Component', () => {
  let props
  let OperationalDataWrapper

  const shallowRenderOperationalData = () => {
    OperationalDataWrapper = shallow(<OperationalData {...props} />)
  }
  const operational = Immutable.fromJS({
    inventory: [
      {
        key: 'stock-outs',
        title: 'Stock outs',
        isNormal: false,
        message: '1 site with problems',
      },
    ],
    site: [],
  })

  beforeEach(() => {
    props = {
      loading: false,
      operational,
      assayType: 'all',
      onAssayTypeClick: () => {},
      onDateRangeClick: () => {},
      onDataReportClick: () => {},
    }
    shallowRenderOperationalData()
  })

  it('should shallow render correctly', () => {
    expect(OperationalDataWrapper).toMatchSnapshot()
  })
})
