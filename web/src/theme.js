import orange from '@material-ui/core/colors/orange'
import grey from '@material-ui/core/colors/grey'
import indigo from '@material-ui/core/colors/indigo'

export default {  
  typography: {
    useNextVariants: true,
    fontFamily: 'Lato, sans-serif',
  },
  palette: {
    primary: indigo,
    secondary: orange,
  },
  overrides: {
    MuiSelect: {
      root: {
        width: 256,
      },
      select: {
        '&:focus': {
          background: 'none',
        },
      },
      icon: {
        color: grey[300],
      },
    },
    MuiMenuItem: {
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
    MuiListItem: {
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
}
