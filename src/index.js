// This is the entry point for our app
import 'core-js/fn/object/assign'
import React from 'react'
import ReactDOM from 'react-dom'
import {Router, Route, browserHistory} from 'react-router'
import {Provider} from 'react-redux'
import {createStore, compose} from 'redux'

import App from './components/App'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import reducer from './reducers/reducer'
import * as actionCreators from './action_creators/action_creators'

import LoggedInShell from './components/LoggedInShell'

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

function requireAuth(nextState, replace) {
  // TODO: Actually check if user is logged in here
  // Right now, just checking if an access token was
  // set in local storage.
  if (!window.sessionStorage.accessToken) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

// our redux store
const store = createStore(reducer, null, compose(
  // applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f
))

// set initial state
store.dispatch(actionCreators.setState({user: {
  name: 'Stefan',
  loggingIn: false,
  loggedIn: false
}}))

// set up routes for react-router
const routes =
<Route component={App}>
  <Route component={Login} path="login" />
    <Route component={LoggedInShell} onEnter={requireAuth}>
      <Route path="/(:login)" component={Dashboard} />
  </Route>
</Route>

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>{routes}</Router>
  </Provider>,
  document.getElementById('app')
)
