import thunk from 'redux-thunk'
import { createStore, compose, applyMiddleware } from 'redux'
import { createLogger } from 'redux-logger'

import rootReducer from './rootReducer'
import { middleware as idleMiddleware } from './IdleRedux'

const showLogger = false
const middleware = [thunk, idleMiddleware]

if (process.env.ASPECT_TARGET === 'local' && showLogger) {
  middleware.push(createLogger({ collapsed: true }))
}

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(...middleware),
  // eslint-disable-next-line no-underscore-dangle
  window.__REDUX_DEVTOOLS_EXTENSION__
    ? // eslint-disable-next-line no-underscore-dangle
      window.__REDUX_DEVTOOLS_EXTENSION__({ trace: true, traceLimit: 25 })
    : f => f
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
