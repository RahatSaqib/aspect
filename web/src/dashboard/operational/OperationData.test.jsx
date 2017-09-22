import Immutable from 'Immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import { OperationalData } from './OperationalData'

describe('OperationData Component', () => {
  const renderer = new ReactShallowRenderer()

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

  it('should shallow render correctly', () => {
    const element = renderer.render(<OperationalData {...props} />)
    expect(element).toMatchSnapshot()
  })
})
