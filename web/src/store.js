import thunk from 'redux-thunk'
import { createStore, compose, applyMiddleware } from 'redux'

import rootReducer from './rootReducer'

import { middleware as idleMiddleware } from './idle/IdleRedux'

const middleware = [thunk, idleMiddleware]

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f
)(createStore)

const store = createStoreWithDevTools(rootReducer)

// enable hot reload for reducers
if (module.hot) {
  module.hot.accept('./rootReducer', () => {
    const nextRootReducer = require('./rootReducer').default
    store.replaceReducer(nextRootReducer)
  })
}

export default store
