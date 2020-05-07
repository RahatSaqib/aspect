import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { Table } from '../../shared/metaReducers/table'
import { Items } from '../../shared/metaReducers/items'
import ExportListButton from '../../globals/components/ExportListButton'

import { ResultList } from './ResultList'

describe('Result List component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    table: new Table(),
    items: new Items(),
    location: {
      search: '',
    },
  }

  it('should shallow render correctly when filter for assay type', () => {
    const element = shallow(
      <ResultList {...props} location={{ search: '?filters=assayType%3DTB' }} />
    )

    expect(element).toMatchSnapshot()
    expect(element.find(ExportListButton)).toHaveLength(1)
  })

  it('should shallow render correctly when filter for assay id', () => {
    const element = shallow(
      <ResultList {...props} location={{ search: '?filters=assayId%3D9' }} />
    )

    expect(element).toMatchSnapshot()
  })
})
