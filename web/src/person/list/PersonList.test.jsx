import React from 'react'
import { shallow } from 'enzyme'
import { Items, makeItems } from '../../shared/metaReducers/items'
import { Table, makeTable } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

describe('Person List module', () => {
  const { PersonList } = require('./PersonList')

  describe('PersonList component', () => {
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
      expect(element.find(ExportListButton)).toHaveLength(0)
    })

    it('should shallow render export button', () => {
      const element = shallow(
        <PersonList
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
  })
})
