export default ({ themedColors }) => ({
  MuiCircularProgress: {
    styleOverrides: {
      colorPrimary: {
        color: themedColors.primary,
      },
    },
  },
})
