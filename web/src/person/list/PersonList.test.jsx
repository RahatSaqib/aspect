import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

describe('Person List module', () => {
  const { PersonList } = require('./PersonList')

  describe('PersonList component', () => {
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
      }
    })

    it('should shallow render correctly', () => {
      const element = shallow(<PersonList {...props} />)

      expect(element).toMatchSnapshot()
      expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
