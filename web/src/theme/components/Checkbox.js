export default ({ themedColors }) => ({
  MuiCheckbox: {
    root: {
      padding: 0,
    },
    colorPrimary: {
      '&$checked': {
        color: themedColors.primary,
      },
    },
  },
})
