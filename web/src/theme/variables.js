import { createTheme } from '@material-ui/core/styles'
import { orange, lightGreen, cyan } from '@material-ui/core/colors'
import { customPropertiesVariables } from '../../cfg/variables'

const theme = createTheme({
  typography: {
    useNextVariants: true,
    fontWeightBold: 700,
    fontWeightBlack: 900,
    body1: {
      fontSize: '0.875rem',
    },
  },
  palette: {
    action: {
      hoverOpacity: 0.2,
    },
    primary: {
      light: cyan[700],
      main: customPropertiesVariables['--ming'],
      dark: cyan[900],
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
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          /**
           * may reset to `position: 'static'` as was before
           * (and remove `margin-top: var(--aspect-app-bar-height);` from `.Page-Content` in
           * file web/src/globals/factories/loggedInFactory/index.css),
           * but need 1st to change @media
           * for showing either VerticalAppBar or HorizontalAppBar which now are both displayed.
           */
          position: 'fixed !important',
        },
      },
    },
    MuiCheckbox: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'standard',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '.875rem',
          textTransform: 'inherit',
        },
      },
    },
  },
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
