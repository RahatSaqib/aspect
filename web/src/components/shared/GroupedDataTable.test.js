import React from 'react'
import { assert } from 'chai'
import sinon from 'sinon'
import Immutable from 'immutable'
import { shallow } from 'enzyme'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
  TableFooter
} from 'material-ui/Table'
import GroupedDataTable from './GroupedDataTable'
import { Items } from '../../shared/metaReducers/groupedItems'
import { Table as GroupedTable } from '../../shared/metaReducers/groupedTable'

describe('Grouped Data Table', () => {
  let props
  let GroupedDataTableWrapper

  beforeEach(() => {
    const now = new Date()
    props = {
      selectable: true,
      handleItemIdSelection: sinon.spy(),
      handleFetch: sinon.spy(),
      items: new Items({
        byId: Immutable.fromJS({
          1: {
            id: '1',
            stringColumn: 'Test Value',
            numberColumn: 13,
            dateColumn: now,
            rowSpans: {
              stringColumn: 2,
              numberColumn: 2,
              dateColumn: 1
            },
            visibleProperties: ['stringColumn', 'numberColumn', 'dateColumn']
          },
          2: {
            id: '2',
            stringColumn: '1: a Test Value',
            numberColumn: 13,
            dateColumn: new Date(now.getTime() + 242345),
            rowSpans: {
              stringColumn: 2,
              numberColumn: 2,
              dateColumn: 1
            },
            visibleProperties: ['dateColumn']
          },
          3: {
            id: '3',
            stringColumn: 'Another Test Value',
            numberColumn: 234,
            dateColumn: new Date(now.getTime() + 8454),
            rowSpans: {
              stringColumn: 3,
              numberColumn: 1,
              dateColumn: 1
            },
            visibleProperties: ['stringColumn', 'numberColumn', 'dateColumn']
          },
          4: {
            id: '4',
            stringColumn: 'Another Test Value',
            numberColumn: 67,
            dateColumn: new Date(now.getTime() + 867454),
            rowSpans: {
              stringColumn: 3,
              numberColumn: 1,
              dateColumn: 1
            },
            visibleProperties: ['numberColumn', 'dateColumn']
          },
          5: {
            id: '5',
            stringColumn: 'Another Test Value',
            numberColumn: 78,
            dateColumn: new Date(now.getTime() + 436456),
            rowSpans: {
              stringColumn: 3,
              numberColumn: 1,
              dateColumn: 1
            },
            visibleProperties: ['numberColumn', 'dateColumn']
          },
          6: {
            id: '6',
            stringColumn: 'Yet Another Test Value',
            numberColumn: 675,
            dateColumn: new Date(now.getTime() + 2342),
            rowSpans: {
              stringColumn: 5,
              numberColumn: 2,
              dateColumn: 1
            },
            visibleProperties: ['stringColumn', 'numberColumn', 'dateColumn']
          },
          7: {
            id: '7',
            stringColumn: 'Yet Another Test Value',
            numberColumn: 675,
            dateColumn: new Date(now.getTime() + 56546),
            rowSpans: {
              stringColumn: 5,
              numberColumn: 2,
              dateColumn: 1
            },
            visibleProperties: ['dateColumn']
          },
          8: {
            id: '8',
            stringColumn: 'Yet Another Test Value',
            numberColumn: 43,
            dateColumn: new Date(now.getTime() + 236423),
            rowSpans: {
              stringColumn: 5,
              numberColumn: 3,
              dateColumn: 1
            },
            visibleProperties: ['numberColumn', 'dateColumn']
          },
          9: {
            id: '9',
            stringColumn: 'Yet Another Test Value',
            numberColumn: 43,
            dateColumn: new Date(now.getTime() + 9645),
            rowSpans: {
              stringColumn: 5,
              numberColumn: 3,
              dateColumn: 1
            },
            visibleProperties: ['dateColumn']
          },
          10: {
            id: '10',
            stringColumn: 'Yet Another Test Value',
            numberColumn: 43,
            dateColumn: new Date(now.getTime() + 8786786),
            rowSpans: {
              stringColumn: 5,
              numberColumn: 3,
              dateColumn: 1
            },
            visibleProperties: ['dateColumn']
          },
          11: {
            id: '11',
            stringColumn: 'zzz Single Row',
            numberColumn: 8,
            dateColumn: new Date(now.getTime() + 18445),
            rowSpans: {
              stringColumn: 1,
              numberColumn: 1,
              dateColumn: 1
            },
            visibleProperties: ['stringColumn', 'numberColumn', 'dateColumn']
          }
        }),
        currentIdList: new Immutable.List(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
      }),
      table: new GroupedTable({
        loading: false,
        sortCol: 'id',
        sortDir: 'asc',
        page: 0,
        pageSize: 11,
        total: 20
      }),
      columns: [{
        fieldName: 'stringColumn',
        headerText: 'String Values'
      }, {
        fieldName: 'numberColumn',
        headerText: 'A Number Property',
        format: data => data * 2
      }, {
        fieldName: 'dateColumn',
        headerText: 'Date Assigned',
        format: data => data.toLocaleDateString()
      }],
      intl: {
        formatNumber: sinon.spy(),
        formatMessage: sinon.spy()
      },
      messages: {}
    }
    GroupedDataTableWrapper = shallow(<GroupedDataTable {...props} />)
  })

  it('should render a table with a header, body and footer', () => {
    const table = GroupedDataTableWrapper.find(Table)
    assert.equal(table.find(TableHeader).length, 1)
    assert.equal(table.find(TableBody).length, 1)
    assert.equal(table.find(TableFooter).length, 1)
  })

  it('should render columns in the table header', () => {
    const tableHeaderColumns = GroupedDataTableWrapper
      .find(Table)
      .find(TableHeader)
      .find(TableRow)
      .find(TableHeaderColumn)
    assert.equal(tableHeaderColumns.length,
      props.columns.length + (props.table.get('extraColumns') ? props.table.get('extraColumns').size : 0))
    for (let i = 0; i < props.columns.length; i++) {
      assert.deepEqual(tableHeaderColumns.at(i).props(), {
        ...tableHeaderColumns.at(i).props(),
        tooltip: props.columns[i].tooltip,
        className: props.columns[i].hideOnXs ? 'pure-hidden-xs' : '',
        ...props.columns[i].extraProps
      })
      const headerText = tableHeaderColumns.at(i).find('span').text()
      assert.equal(headerText, props.columns[i].headerText)
    }
    if (props.table.get('extraColumns')) {
      for (let i = 0; i < props.table.get('extraColumns').size; i++) {
        const extraColumn = props.table.getIn(['extraColumns', i])
        assert.deepEqual(tableHeaderColumns.at(props.columns.length + i).props(), {
          ...tableHeaderColumns.at(i).props(),
          tooltip: extraColumn.get('tooltip'),
          className: extraColumn.get('hideOnXs') ? 'pure-hidden-xs' : '',
          ...extraColumn.get('extraProps').toJS()
        })
        const headerText = tableHeaderColumns.at(props.columns.length + i).find('span').text()
        assert.equal(headerText, extraColumn.get('title'))
      }
    }
  })

  it('should render rows for each of the IDs in the current ID list', () => {
    const tableRows = GroupedDataTableWrapper
      .find(Table)
      .find(TableBody)
      .find(TableRow)

    assert.equal(tableRows.length, props.items.get('currentIdList').size)
  })

  it('should render cells in each row for each of the visible properties in the item', () => {
    const tableRows = GroupedDataTableWrapper
      .find(Table)
      .find(TableBody)
      .find(TableRow)

    const extraColumns = props.table.get('extraColumns')
    for (let i = 0; i < props.items.get('currentIdList').size; i++) {
      const tableRow = tableRows.at(i)
      const id = props.items.getIn(['currentIdList', i])
      const record = props.items.getIn(['byId', id])
      assert.equal(tableRow.children().length, record.get('visibleProperties').size + extraColumns.size)
    }
  })

  it('should set rowSpans on data cells to display data in groups', () => {
    const tableRows = GroupedDataTableWrapper
      .find(Table)
      .find(TableBody)
      .find(TableRow)

    for (let i = 0; i < props.items.get('currentIdList').size; i++) {
      const tableRow = tableRows.at(i)
      const id = props.items.getIn(['currentIdList', i])
      const recordRowSpans = props.items.getIn(['byId', id, 'rowSpans'])
      tableRow.children().forEach((tableRowColumn) => {
        const fieldName = tableRowColumn.node.key
        if (recordRowSpans.has(fieldName)) {
          assert.equal(tableRowColumn.props().rowSpan, recordRowSpans.get(fieldName))
        } else {
          assert.equal(tableRowColumn.props().rowSpan, 1)
        }
      })
    }
  })
})
