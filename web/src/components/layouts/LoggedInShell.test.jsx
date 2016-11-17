import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import { LoggedInShell } from './LoggedInShell'

describe('LoggedInShell', () => {
  const props = {
    location: {
      pathname: ''
    },
    drawerOpen: false,
    children: {},
    closeDrawer: () => {},
    toggleDrawer: () => {},
    logoutStart: () => {}
  }
  let output

  // using shallow rendering here because we're not interested
  // in what exactly the sub components are doing
  beforeEach(() => {
    output = shallow(<LoggedInShell {...props} />)
  })

  it('Is a div that contains ErrorDisplay, SideNav, Nav and at least one other child', () => {
    assert.equal(output.node.type, 'div')
    assert.isAtLeast(output.props().children.length, 4)
  })
})
