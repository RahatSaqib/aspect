export default ({ theme }) => ({
  MuiSnackbarContent: {
    root: {
      [theme.breakpoints.up('md')]: {
        flexGrow: 1,
        maxWidth: 'unset',
      },
    },
  },
})
