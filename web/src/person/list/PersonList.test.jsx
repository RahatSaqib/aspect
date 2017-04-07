import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Helmet from 'react-helmet'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
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

    it('should contain a selectable DataTableWithEmptyList with columns for person records', () => {
      const dataTable = PersonListWrapper.find(DataTableWithEmptyList)
      expect(dataTable.length).toEqual(1)
      expect(dataTable.props().selectable).toBe(true)
      expect(dataTable.props().columns).toEqual([
        { db: 'name', title: 'Name' },
        { db: 'level', title: 'Job', hideOnXs: true },
        { db: 'state', title: 'State', hideOnXs: true },
        { db: 'lga', title: 'County', hideOnXs: true }
      ])
    })

    it('should contain a list filter', () => {
      const listFilter = PersonListWrapper.find(ListFilterContainer)
      expect(listFilter.length).toEqual(1)
    })

    it('should set the page title', () => {
      const helmet = PersonListWrapper.find(Helmet)
      expect(helmet.props().title).toEqual('Contacts')
    })
  })
})
