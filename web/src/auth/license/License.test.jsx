import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import { License } from './License'

describe('License component', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    licenseContent: 'License here!\nYou better accept!',
    onDoNotAcceptClick: _.noop,
    onAcceptClick: _.noop,
  }

  it('should shallow render without crash', () => {
    shallow(<License {...props} />)
  })

  it('should render the license content with newlines replaced', () => {
    const license = shallow(<License {...props} />)

    expect(
      license
        .find('p')
        .at(0)
        .text()
    ).toBe('License here!')

    expect(
      license
        .find('p')
        .at(1)
        .text()
    ).toBe('You better accept!')
  })
})
