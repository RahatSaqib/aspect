import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import ExportListButton from '../../../oldComponents/ExportListButton'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'
import { RouterList } from './RouterList'

// TODO: Fix the issues with providers.
describe.skip('RouterList', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
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
