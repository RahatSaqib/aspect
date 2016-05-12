import React from 'react'
import LoggedInShell from '../../src/components/LoggedInShell'
import { assert } from 'chai'
import { createComponentFromJsx } from 'helpers/shallowRenderHelper'

describe('LoggedInShell', () => {

  let output

  // using shallow rendering here because we're not interested
  // in what exactly the sub components are doing
  beforeEach(() => {
    output = createComponentFromJsx(<LoggedInShell children={{}} />)
  })

  it('Is a div that contains ErrorDisplay, SideNav, Nav and at least one other child', () => {
    assert.equal(output.type, 'div')
    assert.isAtLeast(output.props.children.length, 4)
  })
})
