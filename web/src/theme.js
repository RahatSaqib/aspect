import orange from '@material-ui/core/colors/orange'
import grey from '@material-ui/core/colors/grey'

export default {  
  typography: {
    useNextVariants: true,
    fontFamily: 'Lato, sans-serif',
  },
  palette: {
    primary: {
      light: process.env['--aspect-color-chill-blue-3'],
      main: process.env['--aspect-color-chill-blue-2'],
      dark: process.env['--aspect-color-chill-blue-1'],
      contrastText: '#fff',
    },
    secondary: orange,
  },
  overrides: {
    MuiButton: {
      root:{        
        borderRadius: process.env['--toolbox-button-border-radius'],
      },      
      containedSecondary: {
        backgroundColor: process.env['--aspect-button-accent-color'],
        color: '#fff'
      }
    },
    MuiSvgIcon: {
      root: {       
        fontSize: 16,
      },
      fontSizeSmall: {
        fontSize: 14,
      },
      fontSizeLarge: {
        fontSize: 24,
      },
    },
    MuiSelect: {
      root: {
        width: 256,
      },
      select: {
        '&:focus': {
          background: 'none',
        },
      },
      icon: {
        color: grey[300],
      },
    },
    MuiMenuItem: {
      root: {
        minWidth: 256,
      },
      selected: {
        color: orange[700],
        '&:hover': {
          background: 'none',
        },
      },
    },
    MuiListItem: {
      root: {
        paddingTop: 4,
        paddingBottom: 4,
        '&$selected': {
          background: 'none',
        },
        '&$selected:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
      selected: {},
    },
  },
}
