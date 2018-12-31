export default ({ theme }) => ({
  MuiSvgIcon: {
    root: {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-sm'],
    },
    fontSizeSmall: {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-md'],
    },
    fontSizeLarge: {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-lg'],
    },
  },
})
