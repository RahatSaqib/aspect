import theme from '../src/theme'
import { assert } from 'chai'

describe('Theme', () => {
  it('It is an object that contains at least the primary and accent colors', () => {
    assert.deepProperty(theme, 'palette.primary1Color')
    assert.deepProperty(theme, 'palette.primary2Color')
    assert.deepProperty(theme, 'palette.primary3Color')
    assert.deepProperty(theme, 'palette.accent1Color')
    assert.deepProperty(theme, 'palette.accent2Color')
    assert.deepProperty(theme, 'palette.accent3Color')
  })
})
