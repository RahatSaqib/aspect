import _ from 'lodash'
import React from 'react'
import renderer from 'react-test-renderer'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import { MiniChart } from './MiniChart'

describe('MiniChart module', () => {
  describe('MiniChart component', () => {
    it('should render correctly', () => {
      const component = renderer.create(
        <MuiThemeProvider>
          <MiniChart
            data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
            label="SomeLabel"
            number={12}
            bgcolor="#FBC02D"
            intl={{ formatNumber: _.identity }}
          />
        </MuiThemeProvider>
      )
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
})
