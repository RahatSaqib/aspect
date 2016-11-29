import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Helmet from 'react-helmet'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTable from '../../components/shared/DataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { PersonList } from './PersonList'

describe('Person List Component', () => {
  describe('PersonList', () => {
    let props
    let PersonListWrapper

    const shallowRenderPersonList = () => {
      PersonListWrapper = shallow(<PersonList {...props} />)
    }

    beforeEach(() => {
      props = {
        setPageTitle: sinon.spy(),
        table: new Table(),
        intl: {
          formatMessage: message => message.defaultMessage
        },
        items: new Items(),
        configureListFilter: () => {},
        listFilter: {},
        router: {},
        fetchListFilteredPersons: sinon.spy()
      }
      shallowRenderPersonList()
    })

    it('should contain a selectable DataTable with columns for person records', () => {
      const dataTable = PersonListWrapper.find(DataTable)
      assert.equal(dataTable.length, 1)
      assert.isTrue(dataTable.props().selectable)
      assert.deepEqual(dataTable.props().columns, [
        { db: 'name', title: 'Name' },
        { db: 'level', title: 'Role', hideOnXs: true },
        { db: 'state', title: 'State', hideOnXs: true },
        { db: 'lga', title: 'County', hideOnXs: true }
      ])
    })

    it('should contain a list filter', () => {
      const listFilter = PersonListWrapper.find(ListFilterContainer)
      assert.equal(listFilter.length, 1)
    })

    it('should set the page title', () => {
      const helmet = PersonListWrapper.find(Helmet)
      assert.equal(helmet.props().title, 'Contacts')
    })
  })
})
