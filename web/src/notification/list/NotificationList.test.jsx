import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'
import { NotificationList } from './NotificationList'
import { Items, makeItems } from '../../shared/metaReducers/items'
import { Table, makeTable } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

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
      expect(element.find(ExportListButton)).toHaveLength(0)
    })
    it('should render export button', () => {
      const element = shallow(
        <NotificationList
          {...props}
          table={makeTable({ total: 1 })}
          items={makeItems({
            currentIdList: ['1'],
            byId: {
              1: {
                id: '1',
              },
            },
          })}
        />
      )
      expect(element).toMatchSnapshot()
      expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
