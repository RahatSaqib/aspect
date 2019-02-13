export default ({ themedColors }) => ({
  MuiInput: {
    underline: {
      '&:after': {
        borderBottom: `2px solid ${themedColors.inputColor}`,
      },
    },
  },
})
