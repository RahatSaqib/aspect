// This file contains all possible settings for
// customizing the material-ui theme
// See here for the possible properties:
// https://github.com/callemall/material-ui/blob/master/src/styles/getMuiTheme.js
import {
  lightGreen300,
  lightGreen600,
  lightGreen700,
  orange700,
  grey700,
  grey500,
  grey400,
  grey100,
} from 'material-ui/styles/colors'

export default {
  appBar: {
    height: 56,
  },
  drawer: {
    width: 220,
  },
  menu: {
    textColor: grey700,
    color: lightGreen300,
  },
  spacing: {
    iconSize: 24,
  },
  tableHeaderColumn: {
    textColor: grey700,
    height: 24,
    spacing: 12,
  },
  tableRow: {
    hoverColor: grey100,
  },
  tableRowColumn: {
    height: 24,
    spacing: 12,
  },
  textField: {
    floatingLabelColor: grey500,
    // disabledTextColor: palette.disabledColor,
    borderColor: grey400,
  },
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: lightGreen600,
    primary2Color: lightGreen700,
    primary3Color: lightGreen300,
    accent1Color: orange700,
    accent2Color: lightGreen300,
    accent3Color: orange700,
  },
}
