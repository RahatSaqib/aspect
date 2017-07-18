import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

describe('Person List module', () => {
  const { PersonList } = require('./PersonList')

  describe('PersonList component', () => {
    const renderer = new ReactShallowRenderer()
    let props

    beforeEach(() => {
      props = {
        table: new Table(),
        intl: {
          formatMessage: message => message.defaultMessage,
          formatDate: date => JSON.stringify(date),
          formatTime: time => JSON.stringify(time),
          formatRelative: value => JSON.stringify(value),
          formatNumber: value => JSON.stringify(value),
          formatPlural: value => JSON.stringify(value),
          formatHTMLMessage: value => JSON.stringify(value),
        },
        fetchListFilteredPersons: () => {},
        items: new Items(),
      }
    })

    it('should shallow render correctly', () => {
      const element = renderer.render(<PersonList {...props} />)

      expect(element).toMatchSnapshot()
    })
  })
})
