import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import { ReportList } from './ReportList'

describe('ReportList component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    items: new Items(),
    table: new Table(),
    sortCol: 'name',
    fetchReports: () => {},
    location: {
      search: '',
    },
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ReportList {...props} />)

    expect(element).toMatchSnapshot()
  })
})
