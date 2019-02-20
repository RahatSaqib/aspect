import React from 'react'
import { shallow } from 'enzyme'

import AbnormalBarGraph from './AbnormalBarGraph'

describe('AbnormalBarGraph Component', () => {
  const props = {
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

  it('should shallow render without crash', () => {
    shallow(<AbnormalBarGraph {...props} />)
  })
})
