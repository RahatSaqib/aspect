import React from 'react'
import sinon from 'sinon'
import renderer from 'react-test-renderer'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { Provider } from 'react-redux'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { IntlProvider } from 'react-intl'
import store from '../../store'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import { DeviceApiKeyList } from './DeviceApiKeyList'

jest.mock('material-ui/Checkbox', () => 'StubCheckbox')

describe('Device Api Key List Component', () => {
  describe('DeviceApiKeyList', () => {
    let props
    const now = new Date()

    beforeEach(() => {
      props = {
        setPageTitle: sinon.spy(),
        table: new Table(),
        intl: {
          formatMessage: message => message.defaultMessage,
          formatDate: date => JSON.stringify(date),
          formatTime: time => JSON.stringify(time),
          formatRelative: value => JSON.stringify(value),
          formatNumber: value => JSON.stringify(value),
          formatPlural: value => JSON.stringify(value),
          formatHTMLMessage: value => JSON.stringify(value),
          now: () => now
        },
        fetchDeviceApiKeys: () => {},
        items: new Items(),
        configureListFilter: () => {},
        exportDeviceApiKeys: () => {},
        generateDeviceApiKeys: () => {},
        assignDeviceApiKeys: () => {},
        updateSingleDeviceApiKey: () => {},
        listFilter: {},
      }
    })

    it('should shallow render correctly', () => {
      const renderer = new ReactShallowRenderer()
      renderer.render(<DeviceApiKeyList {...props} />)

      const result = renderer.getRenderOutput()
      expect(result).toMatchSnapshot()
    })

    it('should render DOM correctly', () => {
      const component = renderer.create(<Provider store={store}>
        <MuiThemeProvider>
          <IntlProvider locale="en">
            <DeviceApiKeyList {...props} />
          </IntlProvider>
        </MuiThemeProvider>
      </Provider>)
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
})
