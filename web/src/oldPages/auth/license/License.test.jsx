import React from 'react'
import { shallow } from 'enzyme'
import noop from 'lodash/noop'
import { createIntl } from 'react-intl'
import { License } from './License'

describe('License component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    licenseContent: 'License here!\nYou better accept!',
    onDoNotAcceptClick: noop,
    onAcceptClick: noop,
  }

  it('should shallow render without crash', () => {
    shallow(<License {...props} />)
  })

  it('should render the license content with newlines replaced', () => {
    const license = shallow(<License {...props} />)

    expect(license.find('p').at(0).text()).toBe('License here!')

    expect(license.find('p').at(1).text()).toBe('You better accept!')
  })
})
