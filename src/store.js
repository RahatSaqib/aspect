import thunk from 'redux-thunk'
import {createStore, compose, applyMiddleware} from 'redux'

import rootReducer from './reducers/index'
import { browserHistory } from 'react-router'

let middleware = [thunk]

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f,
)(createStore)

const store = createStoreWithDevTools(rootReducer)

export const history = browserHistory

// enable hot reload for reducers
if (module.hot){
  module.hot.accept('./reducers/', () => {
    const nextRootReducer = require('./reducers/index').default
    store.replaceReducer(nextRootReducer)
  })
}

export default store
