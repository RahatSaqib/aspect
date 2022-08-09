import { orange } from '@mui/material/colors'

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
