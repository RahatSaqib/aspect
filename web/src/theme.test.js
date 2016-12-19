import theme from './theme'

describe('Theme', () => {
  it('It is an object that contains at least the primary and accent colors', () => {
    expect(theme.palette.primary1Color).toExist()
    expect(theme.palette.primary2Color).toExist()
    expect(theme.palette.primary3Color).toExist()
    expect(theme.palette.accent1Color).toExist()
    expect(theme.palette.accent2Color).toExist()
    expect(theme.palette.accent3Color).toExist()
  })
})
