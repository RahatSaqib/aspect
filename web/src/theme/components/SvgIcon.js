export default ({ theme }) => ({
  MuiSvgIcon: {
    root: {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-md'],
    },
    fontSizeSmall: {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-sm'],
    },
    fontSizeLarge: {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-lg'],
    },
  },
})
