import { grey } from '@material-ui/core/colors'

export default () => ({
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
})
