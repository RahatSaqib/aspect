import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { createIntl } from 'react-intl'
import AspectExportListButton from '../../../components/AspectExportListButton'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'

describe('Result List component', () => {
  const { ResultListWithProps } = require('./ResultList')

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

  it('should shallow render correctly when filter for assay type', () => {
    const element = shallow(<ResultListWithProps {...props} />)

    expect(element).toMatchSnapshot()
    expect(element.find(AspectExportListButton)).toHaveLength(1)
  })
})
