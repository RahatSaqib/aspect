import React from 'react'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'

describe('Hidden module', () => {
  let getClassNames
  let Hidden

  before(() => {
    ({ getClassNames, Hidden } = proxyquire('./Hidden', {
      './pure-grids-responsive-min.css': {
        __esModule: true,
        default: new Proxy({}, { get(t, name) { return name } })
      }
    }))
  })

  describe('getClassNames function', () => {
    it('should get correct class names', () => {
      const className = getClassNames({
        className: 'abc',
        xs: true,
        sm: true,
        lg: true
      })

      expect(className).toEqual(['abc', 'pure-hidden-xs', 'pure-hidden-sm', 'pure-hidden-lg'])
    })
  })

  describe('Hidden component', () => {
    it('should render a hidden div', () => {
      const ComponentWrapper = shallow(
        <Hidden md xl />
      )

      expect(ComponentWrapper.type()).toEqual('div')
      expect(ComponentWrapper.props().className).toEqual('pure-hidden-md pure-hidden-xl')
    })

    context('Given component = span', () => {
      it('should render a hidden span', () => {
        const ComponentWrapper = shallow(
          <Hidden component="span" md xl />
        )

        expect(ComponentWrapper.type()).toEqual('span')
        expect(ComponentWrapper.props().className).toEqual('pure-hidden-md pure-hidden-xl')
      })
    })
  })
})
