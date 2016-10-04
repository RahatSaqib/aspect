import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import FlagIcon from './FlagIcon'

describe('FlagIcon', () => {
  it('should render an i tage with the correct flag class names', () => {
    const FlagIconWrapper = shallow(<FlagIcon countryIsoAlpha2Code="ZA" />)

    assert.equal(FlagIconWrapper.find('i').props().className, 'flag-icon flag-za')
  })

  describe('When no country code is specified', () => {
    it('should not render an i tag', () => {
      let FlagIconWrapper = shallow(<FlagIcon />)
      assert.equal(FlagIconWrapper.find('i').length, 0)

      FlagIconWrapper = shallow(<FlagIcon countryIsoAlpha2Code="" />)
      assert.equal(FlagIconWrapper.find('i').length, 0)
    })
  })
})
