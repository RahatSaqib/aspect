import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'

import { Table } from '../../shared/metaReducers/table'
import { Items } from '../../shared/metaReducers/items'
import AspectExportListButton from '../../MigratedComponents/AspectExportListButton'

describe('Result List component', () => {
  const { ResultListWithProps } = require('./ResultList')

  let props

  beforeEach(() => {
    props = {
      intl: createIntl({ locale: 'en' }),
      history: {
        push: () => {},
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
      onHeadColumnClick: () => {},
      onRowClick: () => {},
      onExcelClick: () => {},
      isLoading: false,
      columns: Immutable.List([]),
      reducedFilters: () => {},
      onExportClick: () => {},
      total: 0,
    }
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should shallow render correctly when filter for assay type', () => {
    const element = shallow(<ResultListWithProps {...props} />)

    // const element = shallow(
    //   <ResultList location={{ search: '?filters=assayType%3DTB' }} />
    // )

    expect(element).toMatchSnapshot()
    expect(element.find(AspectExportListButton)).toHaveLength(1)
    // expect(element.find(ExportListButton)).toHaveLength(1)
  })
})
