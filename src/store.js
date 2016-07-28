import thunk from 'redux-thunk'
import {createStore, compose, applyMiddleware} from 'redux'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'

import rootReducer from './reducers/index'
import { browserHistory } from 'react-router'

let middleware = [thunk, routerMiddleware(browserHistory) ]

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f,
)(createStore)

const store = createStoreWithDevTools(rootReducer)

/* Create enhanced history object for router */
const createSelectLocationState = () => {
  let prevRoutingState, prevRoutingStateJS
  return (state) => {
    const routingState = state.get('routing') // or state.routing
    if (typeof prevRoutingState === 'undefined' || prevRoutingState !== routingState) {
      prevRoutingState = routingState
      prevRoutingStateJS = routingState.toJS()
    }
    return prevRoutingStateJS
  }
}

// need the selectLocationState option here because we're using immutable and react-router-redux
// doesn't know how to handle that out of the box
export const history = syncHistoryWithStore(browserHistory, store, {
  selectLocationState: createSelectLocationState()
})

// enable hot reload for reducers
if (module.hot){
  module.hot.accept('./reducers/', () => {
    const nextRootReducer = require('./reducers/index').default
    store.replaceReducer(nextRootReducer)
  })
}

export default store