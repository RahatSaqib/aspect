/*
import React from 'react'
import thunk from 'redux-thunk'
import TestUtils from 'react-addons-test-utils'
import Login from 'components/Login'
import {createStore, compose, applyMiddleware} from 'redux'
import { browserHistory } from '../../src/routes'
import handleTransitions from 'redux-history-transitions'
import rootReducer from '../../src/reducers/root'
import chai from 'chai'

let assert = chai.assert

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(thunk),
  handleTransitions(browserHistory)
)(createStore)
const store = createStoreWithDevTools(rootReducer)

function setup() {
  let props = {
    user: {},
    handleLogin: () => { }
    // addTodo: expect.createSpy()
  }

  let renderer = TestUtils.createRenderer()
  renderer.render(<Provider store={store}>
    <Login {...props} />
  </Provider>)

  let output = renderer.getRenderOutput()

  return {
    props,
    output,
    renderer
  }
}

describe('components', () => {
  describe('Login', () => {
    it('should render correctly', () => {
      const { output } = setup()

      assert.equal(output.type, 'header')
      // expect(output.props.className).toBe('header')

      // let [ h1, input ] = output.props.children

      // expect(h1.type).toBe('h1')
      // expect(h1.props.children).toBe('todos')

      // expect(input.props.newTodo).toBe(true)
      // expect(input.props.placeholder).toBe('What needs to be done?')
    })

    it('should call addTodo if length of text is greater than 0', () => {
      const { output, props } = setup()
      let input = output.props.children[1]
      // input.props.onSave('')
      // expect(props.addTodo.calls.length).toBe(0)
      // input.props.onSave('Use Redux')
      // expect(props.addTodo.calls.length).toBe(1)
    })
  })
})
*/
