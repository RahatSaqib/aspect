import { fade } from '@material-ui/core/styles/colorManipulator'

export default ({ theme, themedColors }) => ({
  MuiButton: {
    root: {
      borderRadius: themedColors.buttonBorderRadius,
      textTransform: 'inherit',
    },
    contained: {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.grey[500],
      boxShadow: 'none',
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
    },
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
    containedSecondary: {
      color: theme.palette.common.white,
      backgroundColor: themedColors.secondary,
      '&:hover': {
        backgroundColor: themedColors.secondary,
        '@media (hover: none)': {
          backgroundColor: themedColors.secondary,
        },
      },
    },
    /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
    outlinedPrimary: {
      color: themedColors.primary,
      border: `1px solid ${fade(themedColors.primary, 0.5)}`,
      '&:hover': {
        border: `1px solid ${themedColors.primary}`,
        backgroundColor: fade(
          themedColors.primary,
          theme.palette.action.hoverOpacity
        ),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: 'transparent',
        },
      },
      '&$disabled': {
        border: 'none',
      },
    },
    text: {
      '&.inverse': {
        backgroundColor: theme.palette.common.white,
        color: themedColors.primary,
        border: `1px solid ${themedColors.primary}`,
      },
    },
    /* Styles applied to the root element if `variant="text"` and `color="primary"`. */
    textPrimary: {
      color: themedColors.primary,
    },
    /* Styles applied to the root element if `variant="text"` and `color="secondary"`. */
    textSecondary: {
      color: themedColors.secondary,
    },
  },
})
