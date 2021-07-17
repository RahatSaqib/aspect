import { orange } from '@material-ui/core/colors'

export default () => ({
  MuiMenuItem: {
    styleOverrides: {
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
  },
})
