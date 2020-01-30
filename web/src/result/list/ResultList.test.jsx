import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import { Table, makeTable } from '../../shared/metaReducers/table'
import { Items, makeItems } from '../../shared/metaReducers/items'
import ExportListButton from '../../globals/components/ExportListButton'

import { ResultList } from './ResultList'

describe('Result List component', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    table: new Table(),
    items: new Items(),
    location: {
      search: '',
    },
  }

  it('should shallow render correctly with no export button', () => {
    const element = shallow(<ResultList {...props} />)

    expect(element).toMatchSnapshot()
    expect(element.find(ExportListButton)).toHaveLength(0)
  })

  it('should shallow render correctly with export button', () => {
    const element = shallow(
      <ResultList
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

    expect(element).toMatchSnapshot()
    expect(element.find(ExportListButton)).toHaveLength(1)
  })

  it('should shallow render correctly when filter for assay type', () => {
    const element = shallow(
      <ResultList {...props} location={{ search: '?filters=assayType%3DTB' }} />
    )

    expect(element).toMatchSnapshot()
  })

  it('should shallow render correctly when filter for assay id', () => {
    const element = shallow(
      <ResultList {...props} location={{ search: '?filters=assayId%3D9' }} />
    )

    expect(element).toMatchSnapshot()
  })
})
