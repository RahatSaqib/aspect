import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'
import { NotificationList } from './NotificationList'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

describe('NotificationList module', () => {
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
    fetchNotifications: () => {},
    exportNotifications: () => {},
    userPermissions: Immutable.Set([
      'notification:admin',
      'report:admin',
      'person:admin',
      'device:admin',
      'issue:admin',
      'assay:admin',
      'deviceApiKey:admin',
      'inventory:admin',
      'result:admin',
      'browse:view',
      'demo:admin',
      'task:admin',
      'site:admin',
    ]),
    pageAt: 0,
    pageSize: 10,
  }

  describe('NotificationList component', () => {
    it('should render correctly', () => {
      const element = shallow(<NotificationList {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
