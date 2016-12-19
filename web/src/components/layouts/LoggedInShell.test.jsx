import React from 'react'
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
    expect(output.node.type).toEqual('div')
    expect(output.props().children.length).toBeGreaterThanOrEqual(4)
  })
})
