import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { Helmet } from 'react-helmet'

import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { ReporterList } from './ReporterList'
import DataTableCard from '../../components/shared/DataTableCard'
import ExportListButton from '../../globals/components/ExportListButton'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

describe('ReporterList', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    history: jest.fn(),
    location: { search: '?filters=assayType%3DTB' },
    table: new Table(),
    items: new Items(),
    sortCol: '',
    sortDir: 'asc',
    pageAt: 1,
    onExportClick: jest.fn(),
    pageSize: 1,
    reducedFilters: [],
  }

  const wrapper = shallow(<ReporterList {...props} />)

  it('should render datatable card correctly', () => {
    expect(wrapper.find(DataTableCard)).toHaveLength(1)
  })
  it('should render helmet correctly', () => {
    expect(wrapper.find(Helmet)).toHaveLength(1)
  })
  it('should render DataTableProgressBar correctly', () => {
    expect(wrapper.find(DataTableProgressBar)).toHaveLength(1)
    expect(wrapper.find(ExportListButton)).toHaveLength(1)
  })
})
