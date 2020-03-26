import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'
import { InventoryItemsList } from './InventoryItemsList'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

describe('InventoryItemList module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    location: {
      search: '',
    },
    table: new Table(),
    items: new Items(),
    history: {
      push: () => {},
    },
    inventoryAdjustment: new Immutable.List(),
    showNewInventoryDialog: () => {},
    showReceiveInventoryDialog: () => {},
    showAddInventoryDialog: () => {},
    showTransferInventoryDialog: () => {},
    showRemoveInventoryDialog: () => {},
    hideAdjustInventoryDialog: () => {},
    onGroupBySiteChange: () => {},
    onAddInventorySubmit: () => {},
    onRemoveInventorySubmit: () => {},
    onTransferInventorySubmit: () => {},
    onReceiveInventorySubmit: () => {},
    pageAt: 0,
    pageSize: 10,
  }

  describe('InventoryItemList component', () => {
    it('should render correctly', () => {
      const element = shallow(<InventoryItemsList {...props} />)
      expect(element).toMatchSnapshot()
      expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
