import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import theme from './theme';
import App from './components/App';

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

// Render the App component into the dom
ReactDOM.render(
  <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
    <App/>
  </MuiThemeProvider>,
  document.getElementById('app'));
