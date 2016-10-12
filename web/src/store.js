import thunk from 'redux-thunk'
import {createStore, compose, applyMiddleware} from 'redux'

import rootReducer from './rootReducer'
import { browserHistory } from 'react-router'

import { middleware as idleMiddleware, actions as idleActions } from './components/shared/idle/IdleRedux'

let middleware = [thunk, idleMiddleware]

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f,
)(createStore)

const store = createStoreWithDevTools(rootReducer)

export const history = browserHistory

// enable hot reload for reducers
if (module.hot){
  module.hot.accept('./rootReducer', () => {
    const nextRootReducer = require('./rootReducer').default
    store.replaceReducer(nextRootReducer)
  })
}

// Will start the idle monitoring when the user logs in, and stop it if the user is signed out.
let currentIsAuthorized = false
store.subscribe(() => {
  const previousIsAuthorized = currentIsAuthorized
  const state = store.getState()

  // select from state whether user is logged in
  currentIsAuthorized = state.getIn(['user', 'loggedIn'])

  // if user logged in, watch for idleness
  if(currentIsAuthorized !== previousIsAuthorized) {
    store.dispatch((currentIsAuthorized ? idleActions.start : idleActions.stop)())
  }
})

export default store
