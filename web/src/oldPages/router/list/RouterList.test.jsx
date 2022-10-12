import React from 'react'
import { render, screen } from '@testing-library/react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import ExportListButton from '../../../oldComponents/ExportListButton'
import { I18nProvider } from '../../../providers/I18nProvider'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'
import { RouterList } from './RouterList'

describe('RouterList', () => {
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

  const { asFragment } = render(
    <I18nProvider>
      <RouterList {...props} />
    </I18nProvider>
  )

  it('should render RouterList correctly without export button', () => {
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('RouterListExportButton')).toBeNull()
  })
})
