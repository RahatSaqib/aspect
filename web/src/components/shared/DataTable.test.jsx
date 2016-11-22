import _ from 'lodash'
import Immutable from 'immutable'
import { assert } from 'chai'
import React from 'react'
import { shallow } from 'enzyme'
import DataTable from './DataTable'

describe('DataTable module', () => {
  describe('DataTable component', () => {
    const defaultProps = {
      selectable: false,
      handleItemIdSelection: _.noop,
      handleFetch: _.noop,
      items: {
        byId: {},
        currentIdList: []
      },
      table: {
        loading: false,
        sortCol: '',
        sortDir: '',
        page: 1,
        pageSize: 10,
        total: 10
      },
      columns: [],
      intl: {
        formatMessages: _.noop
      },
      messages: {}
    }

    context('table.loading is true', () => {
      it('should render progress', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            loading: true
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        assert.equal(ComponentWrapper.find('LinearProgress').length, 1)
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

        assert.equal(ComponentWrapper.find('LinearProgress').length, 0)
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
        assert.equal(HiddenWrapper.length, 1)

        const NameSpanInHeader = HiddenWrapper.first().children().find('span')
        assert.equal(NameSpanInHeader.text(), 'Name')
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
          items: {
            getIn([key, ...rest]) {
              return this[key].getIn(rest)
            },
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
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableBodyWrapper = ComponentWrapper.find('TableBody')
        assert.equal(TableBodyWrapper.length, 1)

        const TableRowWrapper = TableBodyWrapper.first().children()
        assert.equal(TableRowWrapper.length, 4)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        assert.equal(TableRowColumnWrapper.length, 1)

        const NameWrapper = TableRowColumnWrapper.first().children()
        assert.equal(NameWrapper.text(), 'Aspect')
      })
    })

    context('for table and pager items', () => {
      it('should render first page with ellipsis', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            page: 0,
            total: 100,
            pageSize: 10
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableFooterWrapper = ComponentWrapper.find('TableFooter')
        assert.equal(TableFooterWrapper.length, 1)

        const TableRowWrapper = TableFooterWrapper.first().children()
        assert.equal(TableRowWrapper.length, 1)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        assert.equal(TableRowColumnWrapper.length, 1)

        const ChildrenWrapper = TableRowColumnWrapper.first().children()
        assert.equal(ChildrenWrapper.first().prop('label'), '< Prev')
        assert.equal(ChildrenWrapper.at(1).prop('label'), '1')
        assert.equal(ChildrenWrapper.at(2).prop('label'), '2')
        assert.equal(ChildrenWrapper.at(3).prop('label'), '3')
        assert.equal(ChildrenWrapper.at(4).prop('label'), '4')
        assert.equal(ChildrenWrapper.at(5).prop('label'), '5')
        assert.equal(ChildrenWrapper.at(6).prop('label'), '6')
        assert.equal(ChildrenWrapper.at(7).prop('label'), '7')
        assert.equal(ChildrenWrapper.at(8).text(), '…')
        assert.equal(ChildrenWrapper.at(9).prop('label'), '9')
        assert.equal(ChildrenWrapper.at(10).prop('label'), '10')
        assert.equal(ChildrenWrapper.last().prop('label'), 'Next >')
      })

      it('should render sixth page', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            page: 5,
            total: 120,
            pageSize: 10
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableFooterWrapper = ComponentWrapper.find('TableFooter')
        assert.equal(TableFooterWrapper.length, 1)

        const TableRowWrapper = TableFooterWrapper.first().children()
        assert.equal(TableRowWrapper.length, 1)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        assert.equal(TableRowColumnWrapper.length, 1)

        const ChildrenWrapper = TableRowColumnWrapper.first().children()
        assert.equal(ChildrenWrapper.first().prop('label'), '< Prev')
        assert.equal(ChildrenWrapper.at(1).prop('label'), '1')
        assert.equal(ChildrenWrapper.at(2).prop('label'), '2')
        assert.equal(ChildrenWrapper.at(3).text(), '…')
        assert.equal(ChildrenWrapper.at(4).prop('label'), '4')
        assert.equal(ChildrenWrapper.at(5).prop('label'), '5')
        assert.equal(ChildrenWrapper.at(6).prop('label'), '6')
        assert.equal(ChildrenWrapper.at(7).prop('label'), '7')
        assert.equal(ChildrenWrapper.at(8).prop('label'), '8')
        assert.equal(ChildrenWrapper.at(9).text(), '…')
        assert.equal(ChildrenWrapper.at(10).prop('label'), '11')
        assert.equal(ChildrenWrapper.at(11).prop('label'), '12')
        assert.equal(ChildrenWrapper.last().prop('label'), 'Next >')
      })

      it('should render twelfth page', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            page: 11,
            total: 120,
            pageSize: 10
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        const TableFooterWrapper = ComponentWrapper.find('TableFooter')
        assert.equal(TableFooterWrapper.length, 1)

        const TableRowWrapper = TableFooterWrapper.first().children()
        assert.equal(TableRowWrapper.length, 1)

        const TableRowColumnWrapper = TableRowWrapper.first().children()
        assert.equal(TableRowColumnWrapper.length, 1)

        const ChildrenWrapper = TableRowColumnWrapper.first().children()
        assert.equal(ChildrenWrapper.first().prop('label'), '< Prev')
        assert.equal(ChildrenWrapper.at(1).prop('label'), '1')
        assert.equal(ChildrenWrapper.at(2).prop('label'), '2')
        assert.equal(ChildrenWrapper.at(3).text(), '…')
        assert.equal(ChildrenWrapper.at(4).prop('label'), '6')
        assert.equal(ChildrenWrapper.at(5).prop('label'), '7')
        assert.equal(ChildrenWrapper.at(6).prop('label'), '8')
        assert.equal(ChildrenWrapper.at(7).prop('label'), '9')
        assert.equal(ChildrenWrapper.at(8).prop('label'), '10')
        assert.equal(ChildrenWrapper.at(9).prop('label'), '11')
        assert.equal(ChildrenWrapper.at(10).prop('label'), '12')
        assert.equal(ChildrenWrapper.last().prop('label'), 'Next >')
      })
    })
  })
})
