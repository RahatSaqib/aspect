import React from 'react'
import { shallow } from 'enzyme'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'

describe('Person List module', () => {
  const { CaseList } = require('./CaseList')

  describe('CaseList component', () => {
    let props

    beforeEach(() => {
      props = {
        intl: {
          formatMessage: message => message.defaultMessage,
          formatDate: date => JSON.stringify(date),
          formatTime: time => JSON.stringify(time),
          formatRelative: value => JSON.stringify(value),
          formatNumber: value => JSON.stringify(value),
          formatPlural: value => JSON.stringify(value),
          formatHTMLMessage: value => JSON.stringify(value),
        },
        navigate: () => {},
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
      const element = shallow(<CaseList {...props} />)

      expect(element).toMatchSnapshot()
    })
  })
})
