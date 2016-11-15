import { assert } from 'chai'
import React from 'react'
import { shallow } from 'enzyme'

import { getClassNames, Hidden } from './Hidden'

describe('Hidden module', () => {
  describe('getClassNames function', () => {
    it('should get correct class names', () => {
      const className = getClassNames({
        className: 'abc',
        xs: true,
        sm: true,
        lg: true
      })

      assert.deepEqual(className, ['abc', 'pure-hidden-xs', 'pure-hidden-sm', 'pure-hidden-lg'])
    })
  })

  describe('Hidden component', () => {
    it('should render a hidden div', () => {
      const ComponentWrapper = shallow(
        <Hidden md xl />
      )

      assert.equal(ComponentWrapper.type(), 'div')
      assert.equal(ComponentWrapper.props().className, 'pure-hidden-md pure-hidden-xl')
    })

    context('Given component = span', () => {
      it('should render a hidden span', () => {
        const ComponentWrapper = shallow(
          <Hidden component="span" md xl />
        )

        assert.equal(ComponentWrapper.type(), 'span')
        assert.equal(ComponentWrapper.props().className, 'pure-hidden-md pure-hidden-xl')
      })
    })
  })
})
