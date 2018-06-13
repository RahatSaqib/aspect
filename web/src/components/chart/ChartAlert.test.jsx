import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import ChartAlert from './ChartAlert'

describe('ChartAlert component', () => {
  const renderer = new ReactShallowRenderer()
  const props = {
    status: 'amber',
    statusString: 'This is an amber alert',
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ChartAlert {...props} />)

    expect(element).toMatchSnapshot()
  })
})
