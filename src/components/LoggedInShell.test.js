import React from 'react'
import {LoggedInShell} from './LoggedInShell'
import expect from 'expect'
import { shallow } from 'enzyme'

describe('LoggedInShell', () => {
  const props = {
    pathname:'',
    drawerOpen:false,
    children: {},
    closeDrawer: () => {},
    toggleDrawer: () => {},
    logoutStart: () => {},
    changeLanguage: () => {}
  }
  let output

  // using shallow rendering here because we're not interested
  // in what exactly the sub components are doing
  beforeEach(() => {
    output = shallow(<LoggedInShell {...props} />)
  })

  it('Is a div that contains ErrorDisplay, SideNav, Nav and at least one other child', () => {
    expect(output.node.type).toBe('div')
    expect(output.props().children.length).toBeGreaterThanOrEqualTo(4)
  })
})
