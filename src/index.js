// This is the entry point for our app
import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, browserHistory} from 'react-router';

import App from './components/App';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

import LoggedInShell from './components/LoggedInShell';

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

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

// set up routes for react-router
const routes =
<Route component={App}>
  <Route component={Login} path="login" />
    <Route component={LoggedInShell} onEnter={requireAuth}>
      <Route path="/(:login)" component={Dashboard} />
  </Route>
</Route>;

ReactDOM.render(
  <Router history={browserHistory}>{routes}</Router>,
  document.getElementById('app')
);
