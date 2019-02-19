export default () => ({
  MuiListItem: {
    root: {
      paddingTop: 4,
      paddingBottom: 4,
      '&$selected': {
        background: 'none',
      },
      '&$selected:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
      },
    },
    selected: {},
  },
})
