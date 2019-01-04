export default ({ theme }) => {
  const center = {
    left: '10%',
    right: '10%',
    transform: 'translateX(0)',
  }
  return {
    MuiSnackbar: {
      anchorOriginBottomCenter: {
        [theme.breakpoints.up('md')]: {
          ...center,
        },
      },
    },
  }
}
