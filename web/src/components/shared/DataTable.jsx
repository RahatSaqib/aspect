// Imports from packages
import _ from 'lodash'
import cx from 'classnames'
import React from 'react'

// Material-UI
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn, TableFooter } from 'material-ui/Table'
import LinearProgress from 'material-ui/LinearProgress'
import SortIcon from 'material-ui/svg-icons/content/sort'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import styles from './DataTable.css'

export class DataTable extends React.PureComponent {

  static propTypes = {
    handleFetch: React.PropTypes.func.isRequired,
    table: React.PropTypes.shape({
      loading: React.PropTypes.bool.isRequired,
      sortCol: React.PropTypes.string.isRequired,
      sortDir: React.PropTypes.string.isRequired,
      filters: React.PropTypes.object.isRequired/* TODO */,
      page: React.PropTypes.number.isRequired,
      pageSize: React.PropTypes.number.isRequired,
      total: React.PropTypes.number.isRequired,
      items: React.PropTypes.object.isRequired/* TODO */
    }).isRequired,
    columns: React.PropTypes.array.isRequired
  }

  state = {
    height: 'inherit',
    fixedHeader: true,
    fixedFooter: true,
    selectable: false,
    multiSelectable: false,
    showCheckboxes: false,
    enableSelectAll: false,
    showRowHover: true,
    stripedRows: false
  }

  componentDidMount() {
    this.fetchData()
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

  fetchData(col, newSort, page){

    const table = this.props.table

    this.props.handleFetch(table.filters, col || table.sortCol, newSort || table.sortDir, page == null ? table.page : page, table.pageSize)
  }

  getPager(page, totalPages){

    // paging controls
    let pagerItems = []

    // if there are lots of pages, how many to show max
    const maxPagingButtons = 9

    // using this for react's key property-using the
    // incrementer leads to flickering when changing pages
    let key = 0

    for (let i = 0; i < totalPages; i++) {
      // if total pages over 12, show first two, last two, and 2 before and after current
      if (totalPages <= maxPagingButtons ||
          (i < 2) || (i >= totalPages - 2) || ((i > page - 3 || i > totalPages - 8) && (i < page + 3 || i < 7))
      ){
        pagerItems.push(
          <FlatButton
            key={key}
            className={cx(styles.Pager__Button, styles['Pager__Button--number'], {
              [styles['Pager__Button--current']]: page === i
            })}
            label={(i + 1)}
            onTouchTap={() => { this.handlePage(i) } }
          />
        )
        key++

        // show ellipsis if 2nd item AND page > 5 (maxPagingButtons/2) OR
        // if 2nd to last item AND page < totalPages - 5 (maxPagingButtons/2)
        if ((key === 2 && page > maxPagingButtons / 2) ||
            (key === maxPagingButtons - 2 && page < totalPages - maxPagingButtons / 2 - 1) ) {
          pagerItems.push(<span style={{ margin: '0 5px' }}>&#8230;</span>)
        }
      }
    }

    return pagerItems
  }

  render() {

    const table = this.props.table

    // show loading indicator?
    const loading = table.loading ?
      <LinearProgress /> :
      <div style={ { margin: 0, padding: 0, height: 4 }}>&nbsp; </div>

    // generate paging for footer
    const page = table.page
    const totalPages = Math.ceil(table.total / table.pageSize)
    let pagerItems = this.getPager(page, totalPages)

    return (
      <div>
        { loading }
        <Table
          height={this.state.height}
          fixedHeader={this.state.fixedHeader}
          fixedFooter={this.state.fixedFooter}
          selectable={this.state.selectable}
          multiSelectable={this.state.multiSelectable}>

          { /* Header - Sort on click in header columns */ }
          <TableHeader
            displaySelectAll={this.state.showCheckboxes}
            adjustForCheckbox={this.state.showCheckboxes}
            enableSelectAll={this.state.enableSelectAll}>
            <TableRow>
              {this.props.columns.map((col) => (
                <TableHeaderColumn key={col.db} tooltip={col.tooltip} className={ col.hideOnXs ? 'pure-hidden-xs' : '' }>
                  <span style={{ cursor: 'pointer' }} onTouchTap={() => { this.handleSort(col.db) } }>
                    {col.title}
                  </span>
                  <SortIcon color={ table.sortCol == col.db ? 'black' : 'white' }
                    style={{ height: 18, width: 18, position: 'relative', top: '4px', left: '4px', transform: table.sortDir === 'asc' ? 'scale(1, -1)' : '' }} />
                </TableHeaderColumn>
              )) }
            </TableRow>
          </TableHeader>

          { /* Body - this is where we fill the table with the data (List of items) */ }
          <TableBody
            displayRowCheckbox={this.state.showCheckboxes}
            deselectOnClickaway={this.state.deselectOnClickaway}
            showRowHover={this.state.showRowHover}
            stripedRows={this.state.stripedRows}>
            {table.items.map((item) => (
              <TableRow key={item.get('id') }>
                {this.props.columns.map((col) => (
                  <TableRowColumn key={item.get(col.db) } className={ col.hideOnXs ? 'pure-hidden-xs' : '' } >
                    {(col.format || _.identity)(item.get(col.db))}
                  </TableRowColumn>
                )) }
              </TableRow>
            )) }
          </TableBody>

          { /* Footer - contains pager */ }
          <TableFooter adjustForCheckbox={true}>
            <TableRow>
              <TableRowColumn colSpan={this.props.columns.length - 1} style={{ textAlign: 'right', padding: '10px 20px 20px 0' }} >
                <FlatButton className={styles.Pager__Button} label="< Prev" onTouchTap={() => { this.handlePage(page - 1) } } disabled={page === 0} />
                  { pagerItems }
                <FlatButton className={styles.Pager__Button} label="Next >" onTouchTap={() => { this.handlePage(page + 1) } } disabled={ page + 1 >= totalPages} />
              </TableRowColumn>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  }
}
