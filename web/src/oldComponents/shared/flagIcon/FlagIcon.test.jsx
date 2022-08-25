import React from 'react'
import { shallow } from 'enzyme'

import FlagIcon from './FlagIcon'

describe('FlagIcon', () => {
  it('should render an i tag with the correct flag class names', () => {
    const FlagIconWrapper = shallow(<FlagIcon countryIsoAlpha2Code="ZA" />)

    expect(FlagIconWrapper.find('i').props().className).toEqual('flag-icon flag-za')
  })

  describe('When no country code is specified', () => {
    it('should not render an i tag', () => {
      let FlagIconWrapper = shallow(<FlagIcon />)
      expect(FlagIconWrapper.find('i').length).toEqual(0)

      FlagIconWrapper = shallow(<FlagIcon countryIsoAlpha2Code="ZA" />)
      expect(FlagIconWrapper.find('i').length).toEqual(1)
    })
  })

  describe('When styles are specified', () => {
    it('should pass them onto i tag', () => {
      const FlagIconWrapper = shallow(<FlagIcon style={{ color: 'red' }} countryIsoAlpha2Code="ZA" />)
      expect(FlagIconWrapper.find('i').props().style.color).toEqual('red')
    })
  })
})
