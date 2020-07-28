const styles = theme => {
  const style = {
    row: {
      cursor: 'pointer',
      '&:nth-child(even)': {
        backgroundColor: process.env['--aspect-color-grey-8'],
      },
      '&:hover': {
        backgroundColor: process.env['--aspect-color-grey-6'],
      },
      '&:first-child > *': {
        borderTopWidth: 2,
      },
      '&:not(:first-child) > *': {
        borderTop: 'none',
      },
    },
    cell: {},
    numeric: {
      textAlign: 'right',
    },
    small: {
      paddingLeft: 10,
      opacity: 0,
      transitionDuration: '0.28s',
      transitionProperty: 'opacity',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        opacity: 1,
      },
    },
  }
  const hidden = {
    display: 'none',
    visibility: 'hidden',
  }
  return ['xs', 'sm', 'md', 'lg', 'xl'].reduce((acc, key) => {
    acc[`hidden${key}Down`] = {
      [theme.breakpoints.down(key)]: hidden,
    }
    return acc
  }, style)
}
export default styles
