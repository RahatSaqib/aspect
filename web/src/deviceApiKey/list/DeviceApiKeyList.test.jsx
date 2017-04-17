import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Helmet from 'react-helmet'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import ListFilterContainer from '../../filter/list/ListFilter'
import { DeviceApiKeyList } from './DeviceApiKeyList'

class Checkbox extends React.PureComponent {

  constructor() {
    super()
    this.state = {
      checked: false,
      disabled: true,
      labelPosition: 'right',
      name: 'selectAll'
    }

    this.onCheck = this.onCheck.bind(this)
  }

  onCheck() {}

  render() {
    return <div />
  }
}

describe('Device Api Key List Component', () => {
  describe('DeviceApiKeyList', () => {
    let props
    let DeviceApiKeyListWrapper

    const shallowRenderDeviceApiKeyList = () => {
      DeviceApiKeyListWrapper = shallow(<DeviceApiKeyList {...props} />)
    }

    beforeEach(() => {
      props = {
        setPageTitle: sinon.spy(),
        table: new Table(),
        intl: {
          formatMessage: message => message.defaultMessage,
          formatDate: (date, formatOptions) => new Intl.DateTimeFormat('en-US', formatOptions).format(date)
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

    it('should contain a selectable DataTableWithEmptyList with columns for person records', () => {
      const dataTable = DeviceApiKeyListWrapper.find(DataTableWithEmptyList)
      expect(dataTable.length).toEqual(1)

      const columns = [
        {
          db: 'id',
          sortable: false,
          title: <Checkbox />,
          extraProps: { style: { width: '5%' } },
          format: () => <Checkbox />
        },
        {
          db: 'createdOn',
          title: 'Created On',
          extraProps: { style: { width: '10%' } },
          format: () => 'date'
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
          title: 'Revoked',
          format: () => <Checkbox />
        }
      ]

      expect(dataTable.props().columns).toEqual(columns)
    })

    it('should contain a list filter', () => {
      const listFilter = DeviceApiKeyListWrapper.find(ListFilterContainer)
      expect(listFilter.length).toEqual(1)
    })

    it('should set the page title', () => {
      const helmet = DeviceApiKeyListWrapper.find(Helmet)
      expect(helmet.props().title).toEqual('Contacts')
    })
  })
})
