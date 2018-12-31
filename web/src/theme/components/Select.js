import grey from '@material-ui/core/colors/grey'

export default () => ({
  MuiSelect: {
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
    },
  },
})
