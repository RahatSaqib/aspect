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
              '2': {
                name: 'Aspect'
              },
              '3': {
                name: 'Web'
              },
              '5': {
                name: 'Api'
              },
              '7': {
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
  })
})
