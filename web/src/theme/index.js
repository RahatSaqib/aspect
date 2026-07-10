import { createTheme, lighten, alpha } from '@mui/material'
import { cyan, grey, lightGreen, orange } from '@mui/material/colors'
import { deDE, enUS, frFR, ptPT, ruRU, ukUA, esES } from '@mui/material/locale'
import { deDE as xdeDE, enUS as xenUS, frFR as xfrFR, esES as xesES, ptBR } from '@mui/x-date-pickers'
import isEmpty from 'lodash/isEmpty'
import { customPropertiesVariables } from './colors'
import xruRU from './ruRUlocale'
import xukUA from './ukUAlocale'

const locale = {
  'de-DE': deDE,
  'en-US': enUS,
  'fr-FR': frFR,
  'pt-PT': ptPT,
  'ru-RU': ruRU,
  'uk-UA': ukUA,
  'es-ES': esES,
}
const xlocale = {
  'de-DE': xdeDE,
  'en-US': xenUS,
  'fr-FR': xfrFR,
  'pt-PT': ptBR,
  'ru-RU': xruRU,
  'uk-UA': xukUA,
  'es-ES': xesES,
}
const themedColors = {
  text: customPropertiesVariables['--aspect-color-white'],
  primary: customPropertiesVariables['--ming'], // '--aspect-color-chill-blue-primary'
  secondary: customPropertiesVariables['--aspect-button-accent-color'],
  buttonBorderRadius: customPropertiesVariables['--aspect-button-border-radius'],
}
const themeDefinition = {
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
    white: {
      main: '#FFF',
    },
  },
  shape: {
    borderRadius: 2,
  },
  customPropertiesVariables,
  components: {
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
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'transparent',
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
            marginRight: '8px',
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
            '&.Mui-disabled': {
              backgroundColor: 'transparent',
              color: theme.palette.grey[600],
            },
          },
        }),
        /* Styles applied to the root element if `variant="[contained | fab]"` and `color="primary"`. */
        containedPrimary: ({ theme }) => ({
          backgroundColor: themedColors.primary,
          '&:hover': {
            backgroundColor: themedColors.primary,
            '@media (hover: none)': {
              backgroundColor: themedColors.primary,
            },
          },
          '&.Mui-disabled': {
            backgroundColor: 'transparent',
            color: theme.palette.grey[600],
          },
        }),
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
            '&.Mui-disabled': {
              backgroundColor: 'transparent',
              color: theme.palette.grey[600],
              border: 'none',
            },
          },
        }),
        text: ({ theme }) => ({
          '&.inverse': {
            backgroundColor: theme.palette.common.white,
            color: themedColors.primary,
            border: `1px solid ${themedColors.primary}`,
            '&.Mui-disabled': {
              backgroundColor: 'transparent',
              color: theme.palette.grey[600],
              border: 'none',
            },
          },
        }),
        textPrimary: {
          color: themedColors.primary,
        },
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
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
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
    MuiRadio: {
      styleOverrides: {
        root: {
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
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
        // margin: 'dense',
        fullWidth: true,
        InputLabelProps: { shrink: true },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        asterisk: { color: 'red' },
      },
    },
  },
}

const getTheme = culture =>
  !isEmpty(culture) ? createTheme(themeDefinition, xlocale[culture], locale[culture]) : createTheme(themeDefinition)

export default getTheme
