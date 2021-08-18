export default ({ theme }) => ({
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '12px 18px',
      },
      head: {
        fontSize: '0.75rem',
        color: 'rgba(0, 0, 0, 0.54)',
        lineHeight: 'normal',
      },
      body: {
        fontSize: theme.typography.fontSize,
      },
    },
  },
})
