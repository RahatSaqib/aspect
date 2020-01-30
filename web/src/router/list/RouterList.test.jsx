import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Helmet from 'react-helmet'
import Immutable from 'immutable'

import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { RouterList } from './RouterList'
import DataTableCard from '../../components/shared/DataTableCard'
import ExportListButton from '../../globals/components/ExportListButton'
import { Items, makeItems } from '../../shared/metaReducers/items'
import { Table, makeTable } from '../../shared/metaReducers/table'

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

  const wrapper = shallow(<RouterList {...props} />)

  it('should render RouterList correctly without export button', () => {
    expect(wrapper.find(ExportListButton)).toHaveLength(0)
  })

  it('should render RouterList correctly with export button', () => {
    const wrapper = shallow(
      <RouterList
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
    expect(wrapper.find(ExportListButton)).toHaveLength(1)
  })
})
