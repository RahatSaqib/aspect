export default () => ({
  MuiExpansionPanelSummary: {
    root: {
      minHeight: 'auto',
      padding: '0 16px 0 16px',
      '&$expanded': {
        minHeight: 'auto',
      },
    },
    content: {
      margin: '12px 0',
      '&$expanded': {
        margin: '12px 0',
      },
    },
  },
})
