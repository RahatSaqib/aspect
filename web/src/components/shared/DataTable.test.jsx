import _ from 'lodash'
import Immutable from 'immutable'
import sinon from 'sinon'
import React from 'react'
import { shallow, mount } from 'enzyme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTable from './DataTable'

describe('DataTable module', () => {
  const mountWithProvider = node => (
    mount(<MuiThemeProvider>{node}</MuiThemeProvider>).find(node.type)
  )

  describe('DataTable component', () => {
    const defaultProps = {
      selectable: false,
      handleItemIdSelection: _.noop,
      handleFetch: _.noop,
      items: new Items(),
      table: new Table({
        loading: false,
        sortCol: '',
        sortDir: '',
        page: 1,
        pageSize: 10,
        total: 10
      }),
      columns: [],
      intl: {
        formatMessages: _.noop
      },
      messages: {}
    }

    context('table.loading is true', () => {
      it('should render progress', () => {
        const props = _.merge({}, defaultProps, {
          table: defaultProps.table.set('loading', true)
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        expect(ComponentWrapper.find('LinearProgress').length).toEqual(1)
      })
    })

    context('table.loading is false', () => {
      it('should not render progress', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            loading: false
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        expect(ComponentWrapper.find('LinearProgress').length).toEqual(0)
      })
    })

    context('having columns', () => {
      it('should render table headers', () => {
        const props = _.merge({}, defaultProps, {
          columns: [
            {
              db: 'name',
              title: 'Name'
            }
          ]
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const HiddenWrapper = ComponentWrapper.find('Hidden')
        expect(HiddenWrapper.length).toEqual(1)

        const NameSpanInHeader = HiddenWrapper.first().children().find('span')
        expect(NameSpanInHeader.text()).toEqual('Name')
      })
    })

    context('having columns and items', () => {
      it('should render table body with table rows', () => {
        const props = _.merge({}, defaultProps, {
          columns: [
            {
              db: 'name',
              title: 'Name'
            }
          ],
          items: defaultProps.items.mergeDeep({
            byId: Immutable.fromJS({
              2: {
                name: 'Aspect'
              },
              3: {
                name: 'Web'
              },
              5: {
                name: 'Api'
              },
              7: {
                name: 'Node'
              }
            }),
            currentIdList: Immutable.fromJS(['2', '3', '5', '7'])
          })
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableBodyWrapper = ComponentWrapper.find('TableBody')
        expect(TableBodyWrapper.length).toEqual(1)

        const TableRowWrapper = TableBodyWrapper.first().children()
        expect(TableRowWrapper.length).toEqual(4)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        expect(TableRowColumnWrapper.length).toEqual(1)

        const NameWrapper = TableRowColumnWrapper.first().children()
        expect(NameWrapper.text()).toEqual('Aspect')
      })
    })

    context('for table and pager items', () => {
      it('should render first page with ellipsis', () => {
        const props = _.merge({}, defaultProps, {
          table: defaultProps.table.merge({
            page: 0,
            total: 100,
            pageSize: 10
          })
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableFooterWrapper = ComponentWrapper.find('TableFooter')
        expect(TableFooterWrapper.length).toEqual(1)

        const TableRowWrapper = TableFooterWrapper.first().children()
        expect(TableRowWrapper.length).toEqual(1)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        expect(TableRowColumnWrapper.length).toEqual(1)

        const ChildrenWrapper = TableRowColumnWrapper.first().children()
        expect(ChildrenWrapper.first().prop('label')).toEqual('< Prev')
        expect(ChildrenWrapper.at(1).prop('label')).toEqual('1')
        expect(ChildrenWrapper.at(2).prop('label')).toEqual('2')
        expect(ChildrenWrapper.at(3).prop('label')).toEqual('3')
        expect(ChildrenWrapper.at(4).prop('label')).toEqual('4')
        expect(ChildrenWrapper.at(5).prop('label')).toEqual('5')
        expect(ChildrenWrapper.at(6).prop('label')).toEqual('6')
        expect(ChildrenWrapper.at(7).prop('label')).toEqual('7')
        expect(ChildrenWrapper.at(8).text()).toEqual('…')
        expect(ChildrenWrapper.at(9).prop('label')).toEqual('9')
        expect(ChildrenWrapper.at(10).prop('label')).toEqual('10')
        expect(ChildrenWrapper.last().prop('label')).toEqual('Next >')
      })

      it('should render sixth page', () => {
        const props = _.merge({}, defaultProps, {
          table: defaultProps.table.merge({
            page: 5,
            total: 120,
            pageSize: 10
          })
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableFooterWrapper = ComponentWrapper.find('TableFooter')
        expect(TableFooterWrapper.length).toEqual(1)

        const TableRowWrapper = TableFooterWrapper.first().children()
        expect(TableRowWrapper.length).toEqual(1)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        expect(TableRowColumnWrapper.length).toEqual(1)

        const ChildrenWrapper = TableRowColumnWrapper.first().children()
        expect(ChildrenWrapper.first().prop('label')).toEqual('< Prev')
        expect(ChildrenWrapper.at(1).prop('label')).toEqual('1')
        expect(ChildrenWrapper.at(2).prop('label')).toEqual('2')
        expect(ChildrenWrapper.at(3).text()).toEqual('…')
        expect(ChildrenWrapper.at(4).prop('label')).toEqual('4')
        expect(ChildrenWrapper.at(5).prop('label')).toEqual('5')
        expect(ChildrenWrapper.at(6).prop('label')).toEqual('6')
        expect(ChildrenWrapper.at(7).prop('label')).toEqual('7')
        expect(ChildrenWrapper.at(8).prop('label')).toEqual('8')
        expect(ChildrenWrapper.at(9).text()).toEqual('…')
        expect(ChildrenWrapper.at(10).prop('label')).toEqual('11')
        expect(ChildrenWrapper.at(11).prop('label')).toEqual('12')
        expect(ChildrenWrapper.last().prop('label')).toEqual('Next >')
      })

      it('should render twelfth page', () => {
        const props = _.merge({}, defaultProps, {
          table: defaultProps.table.merge({
            page: 11,
            total: 120,
            pageSize: 10
          })
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableFooterWrapper = ComponentWrapper.find('TableFooter')
        expect(TableFooterWrapper.length).toEqual(1)

        const TableRowWrapper = TableFooterWrapper.first().children()
        expect(TableRowWrapper.length).toEqual(1)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        expect(TableRowColumnWrapper.length).toEqual(1)

        const ChildrenWrapper = TableRowColumnWrapper.first().children()
        expect(ChildrenWrapper.first().prop('label')).toEqual('< Prev')
        expect(ChildrenWrapper.at(1).prop('label')).toEqual('1')
        expect(ChildrenWrapper.at(2).prop('label')).toEqual('2')
        expect(ChildrenWrapper.at(3).text()).toEqual('…')
        expect(ChildrenWrapper.at(4).prop('label')).toEqual('6')
        expect(ChildrenWrapper.at(5).prop('label')).toEqual('7')
        expect(ChildrenWrapper.at(6).prop('label')).toEqual('8')
        expect(ChildrenWrapper.at(7).prop('label')).toEqual('9')
        expect(ChildrenWrapper.at(8).prop('label')).toEqual('10')
        expect(ChildrenWrapper.at(9).prop('label')).toEqual('11')
        expect(ChildrenWrapper.at(10).prop('label')).toEqual('12')
        expect(ChildrenWrapper.last().prop('label')).toEqual('Next >')
      })
    })

    context('when initial mount', () => {
      it('should call props.handleFetch', () => {
        const props = _.merge({}, defaultProps, {
          handleFetch: sinon.spy()
        })
        mountWithProvider(<DataTable {...props} />)

        expect(props.handleFetch.calledOnce).toEqual(true)
      })
    })

    context('when sort header clicked', () => {
      it('should call props.handleFetch with new sort', () => {
        const props = _.merge({}, defaultProps, {
          columns: [
            {
              db: 'name',
              title: 'Name'
            }
          ],
          table: defaultProps.table.merge({
            sortCol: 'name',
            sortDir: 'asc'
          }),
          handleFetch: sinon.spy()
        })
        const ComponentWrapper = mountWithProvider(<DataTable {...props} />)
        const HiddenWrapper = ComponentWrapper.find('Hidden')
        const NameSpanInHeader = HiddenWrapper.first().children().find('span')

        NameSpanInHeader.simulate('touchTap')
        expect(props.handleFetch.lastCall.args).toEqual(['name', 'desc', 1, 10])
      })
    })

    context('when pager item clicked', () => {
      it('should call props.handleFetch with new page', () => {
        const props = _.merge({}, defaultProps, {
          columns: [
            {
              db: 'name',
              title: 'Name'
            }
          ],
          table: defaultProps.table.merge({
            sortCol: 'name',
            sortDir: 'asc',
            page: 0,
            total: 100,
            pageSize: 10
          }),
          handleFetch: sinon.spy()
        })
        const ComponentWrapper = mountWithProvider(<DataTable {...props} />)
        const ThirdPageWrapper = ComponentWrapper.find('span').find({ children: 3 })

        ThirdPageWrapper.simulate('touchTap')
        expect(props.handleFetch.lastCall.args).toEqual(['name', 'asc', 2, 10])
      })
    })
  })
})
