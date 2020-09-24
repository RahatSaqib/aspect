import React from 'react'
import { shallow } from 'enzyme'

import OperationalData from './OperationalData'

describe('OperationData Component', () => {
  it('should shallow render without crash', () => {
    shallow(<OperationalData />)
  })
})
