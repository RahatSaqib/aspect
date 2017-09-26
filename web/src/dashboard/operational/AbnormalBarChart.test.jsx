import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import AbnormalBarChart from './AbnormalBarChart'

describe('AbnormalBarChart Component', () => {
  const renderer = new ReactShallowRenderer()
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

  it('should shallow render correctly', () => {
    const element = renderer.render(<AbnormalBarChart {...props} />)
    expect(element).toMatchSnapshot()
  })
})
