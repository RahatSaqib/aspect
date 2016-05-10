// This is the entry point for our app
import 'core-js/fn/object/assign'
import React from 'react'
import thunk from 'redux-thunk'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {createStore, compose, applyMiddleware} from 'redux'
import handleTransitions from 'redux-history-transitions'
import rootReducer from './reducers/root'
import { Routes, browserHistory } from './routes'

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

// our redux store with dev tools
const createStoreWithDevTools = compose(
  applyMiddleware(thunk),
  handleTransitions(browserHistory),
  window.devToolsExtension ? window.devToolsExtension() : f => f,
)(createStore)
const store = createStoreWithDevTools(rootReducer)

ReactDOM.render(
  <Provider store={store}>
    <Routes />
  </Provider>,
  document.getElementById('app')
)
