import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { createIntl } from 'react-intl'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { AuthProvider } from '../../../providers/AuthProvider'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'
import { InventoryLogWithProps } from './InventoryLog'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

describe('InventoryLog module', () => {
  const User = Immutable.Record({
    jwt: {
      permissions: ['inventory:view', 'dashboard:summary', 'site:view', 'browse:view'],
    },
  })
  const reduxState = { user: new User() }
  const store = createStore(reducer, reduxState || initialState)

  describe('InventoryLog component', () => {
    it('should render correctly', () => {
      const props = {
        intl: createIntl({ locale: 'en' }),
        navigate: () => {},
        location: {
          search: '',
        },
        reducedFilters: null,
        dispatch: () => {},
        isLoading: false,
        items: new Items(),
        sortCol: 'siteName',
        sortDir: 'asc',
        table: new Table(),
        pageAt: 0,
        pageSize: 10,
        onRemoveInventorySubmit: () => {},
        onReceiveInventorySubmit: () => {},
        showTransferInventoryDialog: () => {},
        onAddInventorySubmit: () => {},
      }

      const element = shallow(
        <Provider store={store}>
          <AuthProvider>
            <InventoryLogWithProps {...props} />
          </AuthProvider>
        </Provider>
      )

      expect(element).toMatchSnapshot()
    })
  })
})
