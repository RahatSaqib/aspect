import { createTheme, lighten } from '@mui/material'
import { lightGreen, grey, cyan, orange } from '@mui/material/colors'
import { alpha } from '@mui/material/styles'
import { customPropertiesVariables } from './colors'

const themedColors = {
  text: customPropertiesVariables['--aspect-color-white'],
  primary: customPropertiesVariables['--ming'], // '--aspect-color-chill-blue-primary'
  secondary: customPropertiesVariables['--aspect-button-accent-color'],
  buttonBorderRadius: customPropertiesVariables['--aspect-button-border-radius'],
}

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
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '8px 16px 16px',
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
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
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: themedColors.buttonBorderRadius,
          textTransform: 'inherit',
          '&.browseButton': {
            marginRight: '1.5em',
            fontWeight: 700,
            paddingRight: '2.5em',
            paddingLeft: '2.5em',
            '@media only screen and (max-width: 600px)': {
              marginBottom: '5px',
            },
          },
        },
        contained: ({ theme }) => ({
          color: theme.palette.common.white,
          backgroundColor: theme.palette.grey[500],
          boxShadow: 'none !important',
          '&$focusVisible': {
            boxShadow: 'none',
          },
          '&:active': {
            boxShadow: 'none',
          },
          '&$disabled': {
            boxShadow: 'none',
          },
          '&:hover': {
            backgroundColor: theme.palette.grey[500],
          },
          '&.inverse': {
            backgroundColor: theme.palette.common.white,
            color: themedColors.primary,
            '&:hover': {
              backgroundColor: theme.palette.common.white,
              color: themedColors.primary,
            },
          },
        }),
        /* Styles applied to the root element if `variant="[contained | fab]"` and `color="primary"`. */
        containedPrimary: {
          backgroundColor: themedColors.primary,
          '&:hover': {
            backgroundColor: themedColors.primary,
            '@media (hover: none)': {
              backgroundColor: themedColors.primary,
            },
          },
        },
        /* Styles applied to the root element if `variant="[contained | fab]"` and `color="secondary"`. */
        containedSecondary: ({ theme }) => ({
          color: theme.palette.common.white,
          backgroundColor: themedColors.secondary,
          '&:hover': {
            backgroundColor: themedColors.secondary,
            '@media (hover: none)': {
              backgroundColor: themedColors.secondary,
            },
          },
        }),
        /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
        outlinedPrimary: ({ theme }) => ({
          color: themedColors.primary,
          border: `1px solid ${alpha(themedColors.primary, 0.5)}`,
          '&:hover': {
            border: `1px solid ${themedColors.primary}`,
            backgroundColor: alpha(themedColors.primary, theme.palette.action.hoverOpacity),
            // Reset on touch devices, it doesn't add specificity
            '@media (hover: none)': {
              backgroundColor: 'transparent',
            },
          },
          '&$disabled': {
            border: 'none',
          },
          '&.inverse': {
            backgroundColor: theme.palette.common.white,
            color: themedColors.primary,
            border: `1px solid ${themedColors.primary}`,
          },
        }),
        text: ({ theme }) => ({
          '&.inverse': {
            backgroundColor: theme.palette.common.white,
            color: themedColors.primary,
            border: `1px solid ${themedColors.primary}`,
          },
        }),
        /* Styles applied to the root element if `variant="text"` and `color="primary"`. */
        textPrimary: {
          color: themedColors.primary,
        },
        /* Styles applied to the root element if `variant="text"` and `color="secondary"`. */
        textSecondary: {
          color: themedColors.secondary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: theme.typography.fontSize,
        }),
      },
    },
    MuiCheckbox: {
      defaultProps: {
        size: 'middle',
      },
      styleOverrides: {
        root: {
          padding: '0 !important',
          transform: 'scale(1.5) !important',
          margin: '0 12px 0 0 !important',
        },
        colorPrimary: {
          '&$checked': {
            color: themedColors.primary,
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: themedColors.primary,
        },
      },
    },
    MuiFormControl: {
      defaultProps: {
        margin: 'normal',
      },
      styleOverrides: {
        marginNormal: {
          marginTop: 0,
          marginBottom: 20,
        },
      },
    },
    MuiFormHelperText: {
      marginDense: {
        marginTop: 4,
        marginBottom: -16,
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          margin: 0,
          width: '100%',
        },
        item: {
          '&.MuiGrid-item': {
            paddingLeft: '0 !important',
            paddingTop: '0 !important',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: lighten(themedColors.primary, 0.6),
        },
        barColorPrimary: {
          backgroundColor: themedColors.primary,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'none',
      },
    },
    MuiListItem: {
      styleOverrides: {
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
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minWidth: 256,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          minWidth: 256,
        },
        select: {
          '&:focus': {},
        },
        icon: {
          color: grey[300],
          fontSize: 24,
        },
      },
    },
    MuiSnackbar: {
      anchorOriginBottomCenter: ({ theme }) => ({
        [theme.breakpoints.up('md')]: {
          left: '10%',
          right: '10%',
          transform: 'translateX(0)',
        },
      }),
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.up('md')]: {
            flexGrow: 1,
            maxWidth: 'unset',
          },
        }),
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: theme.customPropertiesVariables['--aspect-font-size-md'],
        }),
        fontSizeSmall: ({ theme }) => ({
          fontSize: theme.customPropertiesVariables['--aspect-font-size-sm'],
        }),
        fontSizeLarge: ({ theme }) => ({
          fontSize: theme.customPropertiesVariables['--aspect-font-size-lg'],
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 18px',
        },
        head: {
          fontSize: '0.75rem',
          color: 'rgba(0, 0, 0, 0.54)',
          lineHeight: 'normal',
        },
        body: ({ theme }) => ({
          fontSize: theme.typography.fontSize,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        head: {
          height: 48,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'standard',
      },
    },
  },
})

export default theme
