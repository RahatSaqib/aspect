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
      contrastText: '#fff',
    },
    secondary: {
      light: lightGreen[300],
      main: orange[700],
      dark: orange[700],
      contrastText: '#fff',
    },
  },
  shape: {
    borderRadius: 2,
  },
  customPropertiesVariables,
})

const themedColors = {
  text: '#fff',
  primary: customPropertiesVariables['--aspect-color-chill-blue-1'],
  secondary: customPropertiesVariables['--aspect-button-accent-color'],
  buttonBorderRadius:
    customPropertiesVariables['--aspect-button-border-radius'],
}

export default {
  theme,
  themedColors,
}
