import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'

import { OperationalData } from './OperationalData'
import inventoryItems from '../status/InventoryItems'

describe('OperationData Component', () => {
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

  const props = {
    loading: false,
    operational,
    assayType: 'all',
    onAssayTypeClick: () => {},
    onDateRangeClick: () => {},
    onDataReportClick: () => {},
  }

  it('should shallow render without crash', () => {
    shallow(<OperationalData {...props} />)
  })

  it('should shallow render inventory item without crash', () => {
    const wrapper = shallow(<OperationalData {...props} />)
    expect(wrapper.find(inventoryItems)).toHaveLength(1)
  })
})
