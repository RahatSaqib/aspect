import { lighten } from '@material-ui/core/styles/colorManipulator'

export default ({ themedColors }) => ({
  MuiLinearProgress: {
    colorPrimary: {
      backgroundColor: lighten(themedColors.primary, 0.6),
    },
    barColorPrimary: {
      backgroundColor: themedColors.primary,
    },
  },
})
