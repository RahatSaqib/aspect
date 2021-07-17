export default ({ themedColors }) => ({
  MuiCheckbox: {
    defaultProps: {
      size: 'middle',
    },
    styleOverrides: {
      root: {
        padding: 0,
        transform: 'scale(1.5) !important',
        margin: '0 10px 0 !important',
      },
      colorPrimary: {
        '&$checked': {
          color: themedColors.primary,
        },
      },
    },
  },
})
