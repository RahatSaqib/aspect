import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'

describe('FlagIcon', () => {
  let FlagIcon

  beforeEach(() => {
    FlagIcon = proxyquire('./FlagIcon', {
      './FlagIcon.css': {
        'flag-icon': 'flag-icon',
        'flag-za': 'flag-za'
      }
    }).default
  })

  it('should render an i tag with the correct flag class names', () => {
    const FlagIconWrapper = shallow(<FlagIcon countryIsoAlpha2Code="ZA" />)

    assert.equal(FlagIconWrapper.find('i').props().className, 'flag-icon flag-za')
  })

  describe('When no country code is specified', () => {
    it('should not render an i tag', () => {
      let FlagIconWrapper = shallow(<FlagIcon />)
      assert.equal(FlagIconWrapper.find('i').length, 0)

      FlagIconWrapper = shallow(<FlagIcon countryIsoAlpha2Code="ZA" />)
      assert.equal(FlagIconWrapper.find('i').length, 1)
    })
  })

  describe('When styles are specified', () => {
    it('should pass them onto i tag', () => {
      let FlagIconWrapper = shallow(<FlagIcon style={{color: 'red'}} countryIsoAlpha2Code="ZA" />)
      assert.equal(FlagIconWrapper.find('i').props().style.color, 'red')
    })
  })
})
