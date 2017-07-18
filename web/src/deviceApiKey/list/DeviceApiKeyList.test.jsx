import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

jest.mock('material-ui/Checkbox', () => 'StubCheckbox')

describe('Device Api Key List module', () => {
  const { DeviceApiKeyList } = require('./DeviceApiKeyList')

  describe('DeviceApiKeyList component', () => {
    const renderer = new ReactShallowRenderer()
    let props
    const now = new Date()

    beforeEach(() => {
      props = {
        table: new Table(),
        intl: {
          formatMessage: message => message.defaultMessage,
          formatDate: date => JSON.stringify(date),
          formatTime: time => JSON.stringify(time),
          formatRelative: value => JSON.stringify(value),
          formatNumber: value => JSON.stringify(value),
          formatPlural: value => JSON.stringify(value),
          formatHTMLMessage: value => JSON.stringify(value),
          now: () => now,
        },
        fetchDeviceApiKeys: () => {},
        items: new Items(),
        configureListFilter: () => {},
        exportDeviceApiKeys: () => {},
        generateDeviceApiKeys: () => {},
        assignDeviceApiKeys: () => {},
        updateSingleDeviceApiKey: () => {},
      }
    })

    it('should shallow render correctly', () => {
      const element = renderer.render(<DeviceApiKeyList {...props} />)

      expect(element).toMatchSnapshot()
    })
  })
})
