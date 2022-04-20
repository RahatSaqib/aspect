import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { createIntl } from 'react-intl'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
// import ExportListButton from '../../globals/components/ExportListButton'
import { AuthProvider } from '../../Providers/AuthProvider'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

describe('Person List module', () => {
  const { PersonList } = require('./PersonList')
  const User = Immutable.Record({
    jwt: { permissions: ['browse:view', 'dashboard:summary'] },
  })

  const reduxState = { user: new User() }
  const store = createStore(reducer, reduxState || initialState)

  describe('PersonList component', () => {
    let props

    beforeEach(() => {
      props = {
        intl: createIntl({ locale: 'en' }),
        navigate: jest.fn(),
        location: {
          search: '',
        },
        table: new Table(),
        items: new Items(),
        sortCol: 'id',
        sortDir: 'desc',
        pageAt: 0,
        pageSize: 10,
        onHeadColumnClick: () => {},
        onRowClick: () => {},
        onExcelClick: () => {},
        user: new User(),
      }
    })

    it('should shallow render correctly', () => {
      shallow(
        <Provider store={store}>
          <AuthProvider>
            <PersonList {...props} />
          </AuthProvider>
        </Provider>
      )
      /** Disabled as per https://systemone.youtrack.cloud/issue/ASP-2733 */
      // expect(element).toMatchSnapshot()
      // expect(element.find('[data-testid="export-list-button"]')).toHaveLength(1)
      // expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
