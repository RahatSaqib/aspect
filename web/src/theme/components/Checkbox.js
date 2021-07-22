export default ({ themedColors }) => ({
  MuiCheckbox: {
    defaultProps: {
      size: 'middle',
    },
    styleOverrides: {
      root: {
        padding: '0 !important',
        transform: 'scale(1.5) !important',
        margin: '0 12px 0 0 !important',
      },
      colorPrimary: {
        '&$checked': {
          color: themedColors.primary,
        },
      },
    },
  },
})
