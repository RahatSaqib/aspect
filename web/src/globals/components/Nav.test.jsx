import _ from 'lodash'
import React from 'react'
import renderer from 'react-test-renderer'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { MemoryRouter } from 'react-router-dom'

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
          <MemoryRouter>
            <Nav
              pageTitle=""
              pagePath=""
              handleHamburger={_.noop}
              handleSignOut={_.noop}
            />
          </MemoryRouter>
        </MuiThemeProvider>
      , { createNodeMock })
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })

    it('should render pageTitle and pagePath correctly', () => {
      const component = renderer.create(
        <MuiThemeProvider>
          <MemoryRouter>
            <Nav
              pageTitle="My Page Title"
              pagePath="/my-page-title"
              handleHamburger={_.noop}
              handleSignOut={_.noop}
            />
          </MemoryRouter>
        </MuiThemeProvider>
      , { createNodeMock })
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
})
