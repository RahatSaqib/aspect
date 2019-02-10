export default ({ themedColors }) => ({
  MuiFormLabel: {
    root: {
      '&$focused': {
        color: themedColors.inputColor,
      },
    },
  },
})
