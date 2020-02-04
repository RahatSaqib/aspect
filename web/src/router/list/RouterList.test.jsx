import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'

import { RouterList } from './RouterList'
import ExportListButton from '../../globals/components/ExportListButton'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

describe('RouterList', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()
  const props = {
    intl,
    history: jest.fn(),
    location: { search: '' },
    table: new Table(),
    items: new Items(),
    sortCol: '',
    sortDir: 'asc',
    pageAt: 1,
    onExportClick: jest.fn(),
    onRowClick: jest.fn(),
    pageSize: 1,
    reducedFilters: [],
  }

  const element = shallow(<RouterList {...props} />)

  it('should render RouterList correctly without export button', () => {
    expect(element).toMatchSnapshot()
    expect(element.find(ExportListButton)).toHaveLength(1)
  })
})
