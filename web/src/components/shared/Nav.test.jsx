import _ from 'lodash'
import React from 'react'
import renderer from 'react-test-renderer'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import { Nav } from './Nav'

function createNodeMock() {
  return {
    offsetWidth: 0,
    style: {
      width: 0
    }
  }
}

describe('Nav module', () => {
  describe('Nav component', () => {
    it('should render correctly', () => {
      const component = renderer.create(
        <MuiThemeProvider>
          <Nav
            pageTitle=""
            pagePath=""
            handleHamburger={_.noop}
            handleSignOut={_.noop}
          />
        </MuiThemeProvider>
      , { createNodeMock })
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })

    it('should render pageTitle and pagePath correctly', () => {
      const component = renderer.create(
        <MuiThemeProvider>
          <Nav
            pageTitle="My Page Title"
            pagePath="/my-page-title"
            handleHamburger={_.noop}
            handleSignOut={_.noop}
          />
        </MuiThemeProvider>
      , { createNodeMock })
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
})
