require('styles/App.css');
import React from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import theme from '../theme';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        {this.props.children}
      </MuiThemeProvider>
    );
  }
}

export default App;
