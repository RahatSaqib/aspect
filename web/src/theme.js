// This file contains all possible settings for
// customizing the material-ui theme
import {
  lightGreen300,
  lightGreen600,
  lightGreen700,
  orange700,
  grey700,
  grey100
} from 'material-ui/styles/colors'

export default {
  appBar: {
    height: 56
  },
  drawer: {
    width: 220
  },
  spacing: {
    iconSize: 24
    // desktopGutter: 20,
    // desktopGutterMore: 32,
    // desktopGutterLess: 16,
    // desktopGutterMini: 8,
    // desktopKeylineIncrement: 64,
    // desktopDropDownMenuItemHeight: 32,
    // desktopDropDownMenuFontSize: 15,
    // desktopDrawerMenuItemHeight: 48,
    // desktopSubheaderHeight: 48,
    // desktopToolbarHeight: 77
  },
  tableHeaderColumn: {
    textColor: grey700,
    height: 24,
    spacing: 12
  },
  tableRow: {
    hoverColor: grey100
  },
  tableRowColumn: {
    height: 24,
    spacing: 12
  },
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: lightGreen600,
    primary2Color: lightGreen700,
    primary3Color: lightGreen300,
    accent1Color: orange700,
    accent2Color: lightGreen300,
    accent3Color: orange700
      // textColor: black,
      // alternateTextColor: white,
      // canvasColor: white,
      // disabledColor: ColorManipulator.fade(darkBlack, 0.3),
      // borderColor: grey300,
      // pickerHeaderColor: cyan500,
      // clockCircleColor: ColorManipulator.fade(darkBlack, 0.07),
      // shadowColor: fullBlack,
  }
}
