import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'

import { NotificationList } from './NotificationList'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

describe('NotificationList module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
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
      expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
