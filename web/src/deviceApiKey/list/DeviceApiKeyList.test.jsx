import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Helmet from 'react-helmet'
import _ from 'lodash'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { IntlProvider } from 'react-intl'
import store from '../../store'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import ListFilterContainer from '../../filter/list/ListFilter'
import { DeviceApiKeyList } from './DeviceApiKeyList'

jest.mock('material-ui/Checkbox', () => 'StubCheckbox')

describe('Device Api Key List Component', () => {
  describe('DeviceApiKeyList', () => {
    let props
    let DeviceApiKeyListWrapper
    const now = new Date()

    const shallowRenderDeviceApiKeyList = () => {
      DeviceApiKeyListWrapper = shallow(<DeviceApiKeyList {...props} />)
    }

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

      shallowRenderDeviceApiKeyList()
    })

    it('should contain default state properties', () => {
      expect(DeviceApiKeyListWrapper.state().generatorValues.count).toEqual(1)
      expect(DeviceApiKeyListWrapper.state().assignerValues.deviceApiKeyIds).toEqual([])
      expect(DeviceApiKeyListWrapper.state().isGeneratorDialogOpen).toBe(false)
      expect(DeviceApiKeyListWrapper.state().isAssignerDialogOpen).toBe(false)
    })

    it('should contain a selectable DataTableWithEmptyList with columns for Device API Key records', () => {
      const dataTable = DeviceApiKeyListWrapper.find(DataTableWithEmptyList)

      expect(dataTable.length).toEqual(1)
      const columns = [
        {
          db: 'id',
          sortable: false,
          extraProps: { style: { width: '5%' } }
        },
        {
          db: 'createdOn',
          title: 'Created On',
          extraProps: { style: { width: '10%' } }
        },
        {
          db: 'token',
          title: 'Key',
          extraProps: { style: { width: '25%' } },
        },
        {
          db: 'partner',
          title: 'Partner' },
        {
          db: 'country',
          title: 'Country' },
        {
          db: 'site',
          title: 'Site' },
        {
          db: 'device',
          title: 'Device' },
        {
          db: 'revoked',
          title: 'Revoked'
        }
      ]

      expect(dataTable.props().columns.length).toEqual(columns.length)
      for (let i = 0; i < dataTable.props().columns.length; i++) {
        const actualColumn = dataTable.props().columns[i]
        const expectedColumn = columns[i]
        const actualColumnWithExpectedValues = { ...actualColumn, ...expectedColumn }
        expect(actualColumn).toEqual(actualColumnWithExpectedValues)
      }

      const selectableIds = DeviceApiKeyListWrapper.instance().getSelectableIds()
      const { assignerValues } = DeviceApiKeyListWrapper.instance().state
      const mockRow = { get: propName => propName }

      // id Column
      const actualIdColumn = _.find(dataTable.props().columns, { db: 'id' })
      expect(actualIdColumn.title.type).toEqual('StubCheckbox')
      expect(actualIdColumn.title.props).toEqual({
        name: 'selectAll',
        disabled: _.isEmpty(selectableIds),
        checked: !_.isEmpty(assignerValues.deviceApiKeyIds) &&
          _.isEqual(selectableIds, assignerValues.deviceApiKeyIds),
        onCheck: DeviceApiKeyListWrapper.instance().handleSelectAll
      })
      const actualIdColumnFormattedCellContent =
        actualIdColumn.format(undefined, mockRow)
      expect(actualIdColumnFormattedCellContent.type).toEqual('StubCheckbox')
      expect(actualIdColumnFormattedCellContent.props).toEqual({
        name: 'selected',
        'data-device-Api-Key-Id': mockRow.get('id'),
        disabled: !DeviceApiKeyListWrapper.instance().itemSelectable(mockRow),
        checked: assignerValues.deviceApiKeyIds.indexOf(mockRow.get('id')) !== -1,
        onCheck: DeviceApiKeyListWrapper.instance().handleSelect
      })

      // createdOn Column
      const actualCreatedOnColumn = _.find(dataTable.props().columns, { db: 'createdOn' })
      const createdOn = new Date(2017, 3, 17)
      const actualCreatedOnColumnFormattedCellContent =
        actualCreatedOnColumn.format(createdOn)
      expect(actualCreatedOnColumnFormattedCellContent).toEqual(props.intl.formatDate(createdOn))

      // revoked Column
      const actualRevokedColumn = _.find(dataTable.props().columns, { db: 'revoked' })
      const actualRevokedColumnFormattedCellContent =
        actualRevokedColumn.format(1, mockRow)
      expect(actualRevokedColumnFormattedCellContent.type).toEqual('StubCheckbox')
      expect(actualRevokedColumnFormattedCellContent.props).toEqual({
        name: 'revoked',
        'data-device-Api-Key-Id': mockRow.get('id'),
        checked: true,
        onCheck: DeviceApiKeyListWrapper.instance().handleRevoke,
        style: { textAlign: 'center' }
      })
    })

    it('should render correctly', () => {
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

    it('should contain a list filter', () => {
      const listFilter = DeviceApiKeyListWrapper.find(ListFilterContainer)
      expect(listFilter.length).toEqual(1)
    })

    it('should set the page title', () => {
      const helmet = DeviceApiKeyListWrapper.find(Helmet)
      expect(helmet.props().title).toEqual('Device API Keys')
    })
  })
})
