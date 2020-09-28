import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { InventoryItemsList } from './InventoryItemsList'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

const mockStore = configureStore([])

describe('InventoryItemList module', () => {
  const store = mockStore({
    intl: createIntl({ locale: 'en' }),
    location: {
      search: '',
    },
    table: new Table(),
    items: new Items(),
    history: {
      push: () => {},
    },
    inventoryAdjustment: Immutable.List(),
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
  })

  const wrapper = (
    <Provider store={store}>
      <InventoryItemsList />
    </Provider>
  )

  describe('InventoryItemList component', () => {
    it('should render correctly', () => {
      const element = shallow(wrapper)
      expect(element).toMatchSnapshot()
    })
  })
})
