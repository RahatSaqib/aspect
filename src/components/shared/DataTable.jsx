import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

// Material-UI
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn, TableFooter } from 'material-ui/Table'
import LinearProgress from 'material-ui/LinearProgress'
import SortIcon from 'material-ui/svg-icons/content/sort'
import FlatButton from 'material-ui/FlatButton'

export class DataTable extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = {
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
  }

  componentDidMount() {
    this.props.handleFetch(this.props.sortCol, this.props.sortDir, this.props.page, this.props.size, this.props.filters)
  }

  handleSort(col) {

    // only change sort direction if column that we're currently sorting on is clicked
    let newSort = this.props.sortCol === col ? (this.props.sortDir === 'asc' ? 'desc' : 'asc') : this.props.sortDir

    this.props.handleFetch(col, newSort, this.props.page, this.props.size, this.props.filters)

  }

  handlePage(page) {
    this.props.handleFetch(this.props.sortCol, this.props.sortDir, page, this.props.size, this.props.filters)
  }

  render() {

    let loading = this.props.loading ?
      <LinearProgress /> :
      <div style={ { margin: 0, padding: 0, height: 4 }}>&nbsp; </div>

    let page = this.props.page

    let totalPages = Math.ceil(this.props.total / this.props.size)

    let pageItems = []

    totalPages = 30;

    // if there are lots of pages, how many to show max
    const maxPagingButtons = 9

    for (let i = 0; i < totalPages; i++) {
      // if total pages over 12, show first two, last two, and 2 before and after current
      if (totalPages <= maxPagingButtons
        // (page - (page < totalPages - 2 ? 2 : totalPages - page + 3 ) <= i && page + (page >= 2 ? 2 : 4 - page) >= i)){
          ||
          (i < 2) ||
          (i >= totalPages - 2) ||
          ((i > page - 3 || i > totalPages - 8) && (i < page + 3 || i < 7)) //||( i > page - (page < totalPages - 3 ? 2 : totalPages - page + ( 4 / (totalPages - page) )) && i < page + (page > 2 ? 2 : 5 - page) ) )
      ){
        pageItems.push(<FlatButton className={this.props.page === i ? 'pager-button pager-button-number pager-button-current' : 'pager-button pager-button-number'} label={(i + 1)} onTouchTap={() => { this.handlePage(i) } }/>)
      }

      // show ellipsis between first two and current region and last two and current region
      // if (totalPages > maxPagingButtons && ((i === 1 && page > 3) || (i === totalPages - 3)) {
      //   pageItems.push(<span>...</span>)
      // }
    }

    return (
      <div>
        { loading }
        { this.props.page }
        <Table
          height={this.state.height}
          fixedHeader={this.state.fixedHeader}
          fixedFooter={this.state.fixedFooter}
          selectable={this.state.selectable}
          multiSelectable={this.state.multiSelectable}>
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
                  <SortIcon color={ this.props.sortCol == col.db ? 'black' : 'white' }
                    style={{ height: 18, width: 18, position: 'relative', top: '4px', left: '4px', transform: this.props.sortDir === 'asc' ? 'scale(1, -1)' : '' }} />
                </TableHeaderColumn>
              )) }
            </TableRow>
          </TableHeader>
          <TableBody
            displayRowCheckbox={this.state.showCheckboxes}
            deselectOnClickaway={this.state.deselectOnClickaway}
            showRowHover={this.state.showRowHover}
            stripedRows={this.state.stripedRows}>
            {this.props.items.map((item) => (
              <TableRow key={item.get('id') }>
                {this.props.columns.map((col) => (
                  <TableRowColumn key={item.get(col.db) } className={ col.hideOnXs ? 'pure-hidden-xs' : '' } >
                    {col.format ? col.format(item.get(col.db)) : item.get(col.db) }
                  </TableRowColumn>
                )) }
              </TableRow>
            )) }
          </TableBody>
          <TableFooter adjustForCheckbox={true}>
            <TableRow>
              <TableRowColumn colSpan={this.props.columns.length - 1} style={{ textAlign: 'right', padding: '10px 20px 20px 0' }} >
                <FlatButton className={'pager-button'} label="< Prev" onTouchTap={() => { this.handlePage(page - 1) } } disabled={page === 0} />
                  { pageItems }
                <FlatButton className={'pager-button'} label="Next >" onTouchTap={() => { this.handlePage(page + 1) } } disabled={ page + 1 >= totalPages} />
              </TableRowColumn>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  }
}

DataTable.propTypes = {
  handleFetch: React.PropTypes.func.isRequired,
  loading: React.PropTypes.bool.isRequired,
  items: React.PropTypes.object.isRequired,
  sortCol: React.PropTypes.string.isRequired,
  sortDir: React.PropTypes.string.isRequired,
  page: React.PropTypes.number.isRequired,
  size: React.PropTypes.number.isRequired,
  total: React.PropTypes.number.isRequired,
  filters: React.PropTypes.object.isRequired,
  columns: React.PropTypes.array.isRequired
}
