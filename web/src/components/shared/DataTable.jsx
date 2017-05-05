// Imports from packages
import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { intlShape } from 'react-intl'

// Material-UI
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn, TableFooter } from 'material-ui/Table'
import LinearProgress from 'material-ui/LinearProgress'
import SortIcon from 'material-ui/svg-icons/content/sort'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import { Hidden } from '../../components/pureGrids'
import styles from './DataTable.css'

const cssClasses = classnames.bind(styles)

export default class DataTable extends PureComponent {

  static propTypes = {
    selectable: PropTypes.bool,
    multiSelectable: PropTypes.bool,
    handleItemIdSelection: PropTypes.func,
    handleItemIdsSelection: PropTypes.func,
    handleFetch: PropTypes.func.isRequired,
    items: PropTypes.shape({
      byId: PropTypes.object.isRequired,
      currentIdList: PropTypes.object.isRequired
    }).isRequired,
    table: PropTypes.shape({
      loading: PropTypes.bool.isRequired,
      sortCol: PropTypes.string.isRequired,
      sortDir: PropTypes.string.isRequired,
      page: PropTypes.number.isRequired,
      pageSize: PropTypes.number.isRequired,
      total: PropTypes.number.isRequired
    }).isRequired,
    columns: PropTypes.array.isRequired,
    intl: intlShape.isRequired,
    messages: PropTypes.object
  }

  static defaultProps = {
    selectable: true,
    multiSelectable: false,
    handleItemIdSelection: _.noop,
    handleItemIdsSelection: _.noop,
    messages: {},
  }

  getColumns() {
    const {
      table,
      intl,
      messages
    } = this.props

    if (table.extraColumns) {
      const formattedExtraColumns = table.extraColumns.map(column => column.merge({
        format: column.get('type') === 'number' ? (n => (_.isNumber(n) ? intl.formatNumber(n) : null)) : _.identity,
        title: column.get('i18nKey') && messages[column.get('i18nKey')] ? intl.formatMessage[column.get('i18nKey')] : column.get('title')
      }))

      // concat the extra columns in table.extraColumns with the columns specified in table.columns
      return this.props.columns.concat(formattedExtraColumns.toJS())
    }

    return this.props.columns
  }

  getPager(page, totalPages) {
    // paging controls
    const pagerItems = []

    // if there are lots of pages, how many to show max
    const maxPagingButtons = 9

    // using this for react's key property-using the
    // incrementer leads to flickering when changing pages
    let key = 0

    for (let i = 0; i < totalPages; i++) {
      // if total pages over 12, show first two, last two, and 2 before and after current
      if (totalPages <= maxPagingButtons ||
          (i < 2) || (i >= totalPages - 2) ||
          ((i > page - 3 || i > totalPages - 8) && (i < page + 3 || i < 7))
      ) {
        pagerItems.push(
          <FlatButton
            key={key}
            className={cssClasses('Pager__Button', 'Pager__Button--number', {
              'Pager__Button--current': page === i
            })}
            label={(i + 1)}
            onTouchTap={() => { this.handlePage(i) }}
          />
        )
        key += 1

        // show ellipsis if 2nd item AND page > 5 (maxPagingButtons/2) OR
        // if 2nd to last item AND page < totalPages - 5 (maxPagingButtons/2)
        if ((key === 2 && page > maxPagingButtons / 2) ||
            (key === maxPagingButtons - 2 && page < totalPages - 1 - (maxPagingButtons / 2))) {
          pagerItems.push(<span key={`ellipsis-${key}`} style={{ margin: '0 5px' }}>&#8230;</span>)
        }
      }
    }

    return pagerItems
  }

  handleRowSelection = (selectedRows) => {
    const {
      multiSelectable,
      handleItemIdSelection,
      handleItemIdsSelection,
      items
    } = this.props

    if (multiSelectable) {
      const selectedIds = (
        selectedRows === 'all' ?
        items.currentIdList :
        items.currentIdList.filter((id, index) => selectedRows.indexOf(index) !== -1)
      )
      handleItemIdsSelection(selectedIds.toJS())
    } else {
      const selectedId = items.currentIdList.get(selectedRows[0])
      handleItemIdSelection(selectedId)
    }
  }

  handleSort(col) {
    const table = this.props.table

    // only change sort direction if column that we're currently sorting on is clicked
    const newSort = table.sortCol === col ? (table.sortDir === 'asc' ? 'desc' : 'asc') : table.sortDir

    this.fetchData(col, newSort)
  }

  handlePage(page) {
    this.fetchData(null, null, page)
  }

  fetchData(col, newSort, page) {
    const table = this.props.table

    this.props.handleFetch(col || table.sortCol, newSort || table.sortDir, page == null ?
      table.page : page, table.pageSize)
  }

  render() {
    const {
      multiSelectable,
      items,
      table
    } = this.props

    // show loading indicator?
    const loading = table.loading ?
      <LinearProgress /> :
      <div style={{ margin: 0, padding: 0, height: 4 }}>&nbsp; </div>

    // generate paging for footer
    const page = table.page
    const totalPages = Math.ceil(table.total / table.pageSize)
    const columns = this.getColumns()
    const pagerItems = this.getPager(page, totalPages)

    return (
      <div>
        { loading }
        <Table
          height="inherit"
          fixedHeader
          fixedFooter
          selectable={this.props.selectable}
          multiSelectable={multiSelectable}
          onRowSelection={this.handleRowSelection}
        >

          { /* Header - Sort on click in header columns */ }
          <TableHeader
            displaySelectAll={multiSelectable}
            adjustForCheckbox={multiSelectable}
            enableSelectAll={multiSelectable}
          >
            <TableRow>
              {columns.map(col => (
                <Hidden
                  key={col.db}
                  xs={col.hideOnXs}
                  component={TableHeaderColumn}
                  tooltip={col.tooltip}
                  {...col.extraProps}
                >
                  <span style={{ cursor: 'pointer' }} onTouchTap={col.sortable !== false ? () => { this.handleSort(col.db) } : _.noop}>
                    {col.title}
                  </span>
                  {col.sortable !== false && <SortIcon
                    color={table.sortCol === col.db ? 'black' : 'white'}
                    style={{ height: 18, width: 18, position: 'relative', top: '4px', left: '4px', transform: table.sortDir === 'asc' ? 'scale(1, -1)' : '' }}
                  />}
                </Hidden>
              )) }
            </TableRow>
          </TableHeader>

          { /* Body - this is where we fill the table with the data (List of items) */ }
          <TableBody
            displayRowCheckbox={multiSelectable}
            showRowHover
            stripedRows={false}
          >
            {items.currentIdList.map(itemId => (
              <TableRow
                key={itemId} className={cssClasses({
                  'TableRow--selectable': this.props.selectable
                })}
              >
                {columns.map((col) => {
                  const row = items.getIn(['byId', itemId])
                  const data = row.get(col.db)
                  return (
                    <Hidden
                      key={col.db}
                      xs={col.hideOnXs}
                      component={TableRowColumn}
                      {...col.extraProps}
                    >
                      {(col.format || _.identity)(data, row)}
                    </Hidden>
                  )
                })}
              </TableRow>
            )) }
          </TableBody>

          { /* Footer - contains pager */ }
          <TableFooter adjustForCheckbox>
            <TableRow>
              <TableRowColumn colSpan={columns.length - 1} style={{ textAlign: 'right', padding: '10px 20px 20px 0' }} >
                <FlatButton className={styles.Pager__Button} label="< Prev" onTouchTap={() => { this.handlePage(page - 1) }} disabled={page === 0} />
                { pagerItems }
                <FlatButton className={styles.Pager__Button} label="Next >" onTouchTap={() => { this.handlePage(page + 1) }} disabled={page + 1 >= totalPages} />
              </TableRowColumn>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  }
}
