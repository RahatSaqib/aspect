import React from 'react'
import { shallow } from 'enzyme'

import ChartAlert from './ChartAlert'

describe('ChartAlert component', () => {
  const props = {
    status: 'amber',
    statusString: 'This is an amber alert',
  }

  it('should shallow render without crash', () => {
    shallow(<ChartAlert {...props} />)
  })

  it('should apply red class when status neither green nor amber', () => {
    let wrapper = shallow(<ChartAlert {...props} status="green" />)
    expect(
      wrapper
        .find('p')
        .first()
        .hasClass('green')
    ).toBe(true)

    wrapper = shallow(<ChartAlert {...props} status="amber" />)
    expect(
      wrapper
        .find('p')
        .first()
        .hasClass('amber')
    ).toBe(true)

    wrapper = shallow(<ChartAlert {...props} status="other-status" />)
    expect(
      wrapper
        .find('p')
        .first()
        .hasClass('red')
    ).toBe(true)
  })
})
