import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { Table } from '../../shared/metaReducers/table'
import ResultList from './ResultList'

describe('Result List component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    location: { search: '?filters=assayType%3DTB' },
    table: new Table(),
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ResultList {...props} />)

    expect(element).toMatchSnapshot()
  })
})
