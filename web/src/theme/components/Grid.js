export default () => ({
  MuiGrid: {
    styleOverrides: {
      root: {
        margin: 0,
        width: '100%',
      },
      item: {
        '&.MuiGrid-item': {
          paddingLeft: '0 !important',
          paddingTop: '0 !important',
        },
      },
    },
  },
})
