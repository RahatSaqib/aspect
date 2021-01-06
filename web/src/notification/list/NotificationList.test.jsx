import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'

import { Table } from '../../shared/metaReducers/table'
import { Items } from '../../shared/metaReducers/items'
import AspectExportListButton from '../../MigratedComponents/AspectExportListButton'

describe('Notification List component', () => {
  const { NotificationListWithProps } = require('./NotificationList')
  let props

  beforeEach(() => {
    props = {
      intl: createIntl({ locale: 'en' }),
      history: {
        push: jest.fn(),
      },
      location: {
        search: '',
      },
      table: new Table(),
      items: new Items(),
      sortCol: 'id',
      sortDir: 'desc',
      pageAt: 0,
      pageSize: 10,
      onHeadColumnClick: jest.fn(),
      onRowClick: jest.fn(),
      onExcelClick: jest.fn(),
      isLoading: false,
      columns: Immutable.List([]),
      reducedFilters: jest.fn(),
      onExportClick: jest.fn(),
      total: 0,
    }
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should shallow render correctly', () => {
    const element = shallow(<NotificationListWithProps {...props} />)

    expect(element).toMatchSnapshot()
    expect(element.find(AspectExportListButton)).toHaveLength(1)
  })
})
