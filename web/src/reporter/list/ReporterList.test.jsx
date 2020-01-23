import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Helmet from 'react-helmet'
import Immutable from 'immutable'

import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { ReporterList } from './ReporterList'
import DataTableCard from '../../components/shared/DataTableCard'

describe('ReporterList', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()
  const props = {
    intl,
    history: jest.fn(),
    location: { search: '?filters=assayType%3DTB' },
    table: {
      loading: false,
      sortCol: '',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 5,
    },
    items: {
      byId: {},
      currentIdList: Immutable.List([]),
    },
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
  })
})
