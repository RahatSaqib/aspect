import { grey } from '@material-ui/core/colors'

export default () => ({
  MuiSelect: {
    styleOverrides: {
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
  },
})
