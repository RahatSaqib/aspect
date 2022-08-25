import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { createStore } from 'redux'
import Immutable from 'immutable'
import { Provider } from 'react-redux'
import { InventoryItemsListWithProps } from './InventoryItemsList'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'
import { AuthProvider } from '../../../providers/AuthProvider'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

describe('InventoryItemList module', () => {
  const User = Immutable.Record({
    jwt: {
      permissions: ['inventory:edit', 'dashboard:summary', 'site:view', 'browse:view'],
    },
  })
  const reduxState = { user: new User() }
  const store = createStore(reducer, reduxState || initialState)

  describe('InventoryItemList component', () => {
    it('should render correctly', () => {
      const props = {
        intl: createIntl({ locale: 'en' }),
        navigate: () => {},
        location: {
          search: '',
        },
        reducedFilters: null,
        dispatch: () => {},
        breakOutbyLot: true,
        isLoading: false,
        onExcelClick: () => {},
        items: new Items(),
        sortCol: 'siteName',
        sortDir: 'asc',
        table: new Table(),
        pageAt: 0,
        pageSize: 10,
        inventoryAdjustment: Immutable.List(),
        onRemoveInventorySubmit: () => {},
        onReceiveInventorySubmit: () => {},
        showTransferInventoryDialog: () => {},
        onAddInventorySubmit: () => {},
      }

      const element = shallow(
        <Provider store={store}>
          <AuthProvider>
            <InventoryItemsListWithProps {...props} />
          </AuthProvider>
        </Provider>
      )

      expect(element).toMatchSnapshot()
      /** Disabled for the same reason as stated in PersonList.test.jsx */
      // expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
