import { lighten } from '@material-ui/core/styles'

export default ({ themedColors }) => ({
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
})
