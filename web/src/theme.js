import orange from '@material-ui/core/colors/orange'
import grey from '@material-ui/core/colors/grey'
import lightGreen from '@material-ui/core/colors/lightGreen'

export default {
  typography: {
    useNextVariants: true,
    fontFamily: 'Lato, sans-serif',
  },
  palette: {
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
  overrides: {
    MuiButton: {
      root: {
        borderRadius: process.env['--toolbox-button-border-radius'],
      },
      containedSecondary: {
        color: '#fff',
      },
    },
    MuiCard: {
      root: {
        borderRadius: 0,
      },
    },
    MuiExpansionPanel: {
      root: {
        '&:before': {
          opacity: 0,
        },
      },
      expanded: {
        margin: 0,
      },
    },
    MuiExpansionPanelSummary: {
      root: {
        minHeight: 'auto',
        padding: '0 16px 0 16px',
        '&$expanded': {
          minHeight: 'auto',
        },
      },
      content: {
        margin: '12px 0',
        '&$expanded': {
          margin: '12px 0',
        },
      },
    },
    MuiExpansionPanelDetails: {
      root: {
        padding: '8px 16px 16px',
      },
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
        minWidth: 256,
      },
      select: {
        '&:focus': {
          background: 'none',
        },
      },
      icon: {
        color: grey[300],
        fontSize: 24,
      },
    },
    MuiMenuItem: {
      root: {
        minWidth: 256,
        '&$selected': {
          color: orange[700],
        },
        '&$selected:hover': {
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
    MuiStepIcon: {
      root: {
        fontSize: '1.25rem',
      },
    },
  },
}
