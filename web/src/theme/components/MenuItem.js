import orange from '@material-ui/core/colors/orange'

export default () => ({
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
})
