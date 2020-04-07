import { createMuiTheme } from '@material-ui/core/styles'
import orange from '@material-ui/core/colors/orange'
import lightGreen from '@material-ui/core/colors/lightGreen'
import { customPropertiesVariables } from '../../cfg/variables'

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
    fontWeightBold: 700,
    fontWeightBlack: 900,
  },
  palette: {
    action: {
      hoverOpacity: 0.2,
    },
    primary: {
      light: lightGreen[500],
      main: lightGreen[600],
      dark: lightGreen[700],
      contrastText: customPropertiesVariables['--aspect-color-white'],
    },
    secondary: {
      light: lightGreen[300],
      main: orange[700],
      dark: orange[700],
      contrastText: customPropertiesVariables['--aspect-color-white'],
    },
  },
  shape: {
    borderRadius: 2,
  },
  customPropertiesVariables,
})

const themedColors = {
  text: customPropertiesVariables['--aspect-color-white'],
  primary: customPropertiesVariables['--ming'], // '--aspect-color-chill-blue-primary'
  secondary: customPropertiesVariables['--aspect-button-accent-color'],
  buttonBorderRadius:
    customPropertiesVariables['--aspect-button-border-radius'],
}

export default {
  theme,
  themedColors,
}
