import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { createIntl } from 'react-intl'
import AspectExportListButton from '../../../components/AspectExportListButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { Items, makeItems } from '../../../utils/metaReducers/items'
import { Table, makeTable } from '../../../utils/metaReducers/table'
import { ReporterListWithProps } from './ReporterList'

// TODO: Fix the issues with providers
describe.skip('ReporterList', () => {
  let props = {}
  beforeEach(() => {
    props = {
      intl: createIntl({ locale: 'en' }),
      history: jest.fn(),
      location: { search: '?filters=assayType%3DTB' },
      table: new Table(),
      items: new Items(),
      sortCol: '',
      sortDir: 'asc',
      pageAt: 1,
      onExportClick: jest.fn(),
      isLoading: false,
      columns: Immutable.List(),
      onRevokedItem: jest.fn(),
      pageSize: 1,
      reducedFilters: [],
    }
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should render datatable card correctly', () => {
    const element = shallow(<ReporterListWithProps {...props} />)
    expect(element.find(DataTableCard)).toHaveLength(1)
  })
  it('should render helmet correctly', () => {
    const wrapper = shallow(<ReporterListWithProps {...props} />)
    expect(wrapper.find(Helmet)).toHaveLength(1)
  })
  it('should render DataTableProgressBar correctly', () => {
    const wrapper = shallow(
      <ReporterListWithProps
        {...omit(props, ['table', 'items', 'loading'])}
        isLoading
        table={makeTable({ total: 1 })}
        items={makeItems({
          currentIdList: ['1'],
          byId: {
            1: {
              id: '1',

              revoked: false,
            },
          },
        })}
      />
    )

    expect(wrapper.find(DataTableProgressBar)).toHaveLength(1)
    expect(wrapper.find(AspectExportListButton)).toHaveLength(1)
  })
})
