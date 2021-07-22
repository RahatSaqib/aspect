export default ({ theme }) => ({
  MuiSnackbarContent: {
    styleOverrides: {
      root: {
        [theme.breakpoints.up('md')]: {
          flexGrow: 1,
          maxWidth: 'unset',
        },
      },
    },
  },
})
