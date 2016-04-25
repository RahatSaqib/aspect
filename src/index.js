import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, hashHistory} from 'react-router';

import App from './components/App';
import Dashboard from './components/Dashboard';
import LoggedInShell from './components/LoggedInShell';

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

// Render the App component into the dom
// ReactDOM.render(
//   <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
//     <App/>
//   </MuiThemeProvider>,
//   document.getElementById('app'));

  // <Route component={Login} path="login" />


const routes =
<Route component={App}>
  <Route component={LoggedInShell}>
    <Route path="/" component={Dashboard} />
  </Route>
</Route>;

ReactDOM.render(
  <Router history={hashHistory}>{routes}</Router>,
  document.getElementById('app')
);
