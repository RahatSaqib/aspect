import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { Table } from '../../shared/metaReducers/table'
import { Items } from '../../shared/metaReducers/items'

import { ResultList } from './ResultList'

describe('Result List component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    table: new Table(),
    items: new Items(),
  }

  it('should shallow render correctly when filter for assay type', () => {
    const element = renderer.render(
      <ResultList {...props} location={{ search: '?filters=assayType%3DTB' }} />
    )

    expect(element).toMatchSnapshot()
  })

  it('should shallow render correctly when filter for assay id', () => {
    const element = renderer.render(
      <ResultList {...props} location={{ search: '?filters=assayId%3D9' }} />
    )

    expect(element).toMatchSnapshot()
  })
})
