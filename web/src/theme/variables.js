import { createTheme } from '@mui/material/styles'
import { cyan, lightGreen, orange } from '@mui/material/colors'
import { customPropertiesVariables } from '../../cfg/variables'

const theme = createTheme({
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
      // light: lightGreen[500],
      // main: lightGreen[600],
      // dark: lightGreen[700],
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
  },
})

const themedColors = {
  text: customPropertiesVariables['--aspect-color-white'],
  primary: customPropertiesVariables['--ming'], // '--aspect-color-chill-blue-primary'
  secondary: customPropertiesVariables['--aspect-button-accent-color'],
  buttonBorderRadius: customPropertiesVariables['--aspect-button-border-radius'],
}

export default {
  theme,
  themedColors,
}
