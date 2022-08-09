import { grey } from '@mui/material/colors'

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
