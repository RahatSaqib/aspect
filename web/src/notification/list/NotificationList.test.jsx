import React from 'react'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
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
    exportNotifications: () => {},
    userPermissions: Immutable.Set([
      'notification:edit',
      'report:edit',
      'person:edit',
      'device:edit',
      'issue:edit',
      'assay:edit',
      'deviceApiKey:edit',
      'inventory:edit',
      'result:edit',
      'browse:view',
      'demo:edit',
      'task:edit',
      'site:edit',
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
