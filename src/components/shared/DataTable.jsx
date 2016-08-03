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
    this.fetchData()
  }

  handleSort(col) {

    const list = this.props.list

    // only change sort direction if column that we're currently sorting on is clicked
    const newSort = list.get('sortCol') === col ? (list.get('sortDir') === 'asc' ? 'desc' : 'asc') : list.get('sortDir')

    this.fetchData(col, newSort)
  }

  handlePage(page) {
    this.fetchData(null, null, page)
  }

  fetchData(col, newSort, page){

    const list = this.props.list

    this.props.handleFetch(list.get('filters'), col || list.get('sortCol'), newSort || list.get('sortDir'), page == null ? list.get('page') : page, list.get('size'))
  }

  render() {

    const list = this.props.list

    const loading = list.get('loading') ?
      <LinearProgress /> :
      <div style={ { margin: 0, padding: 0, height: 4 }}>&nbsp; </div>

    const page = list.get('page')

    const totalPages = Math.ceil(list.get('total') / list.get('size'))

    let pageItems = []

    // if there are lots of pages, how many to show max
    const maxPagingButtons = 9

    // using this for react's key property-using the
    // incrementer leads to flickering when changing pages
    let key = 0

    for (let i = 0; i < totalPages; i++) {
      // if total pages over 12, show first two, last two, and 2 before and after current
      if (totalPages <= maxPagingButtons
          ||
          (i < 2) ||
          (i >= totalPages - 2) ||
          ((i > page - 3 || i > totalPages - 8) && (i < page + 3 || i < 7))
      ){
        pageItems.push(<FlatButton key={key} className={list.get('page') === i ? 'pager-button pager-button-number pager-button-current' : 'pager-button pager-button-number'} label={(i + 1)} onTouchTap={() => { this.handlePage(i) } }/>)
        key++

        // show ellipsis if 2nd item AND page > 5 (maxPagingButtons/2) OR
        // if 2nd to last item AND page < totalPages - 5 (maxPagingButtons/2)
        if ((key === 2 && page > maxPagingButtons / 2) ||
            (key === maxPagingButtons - 2 && page < totalPages - maxPagingButtons / 2 - 1) ) {
          pageItems.push(<span style={{ margin: '0 5px' }}>&#8230;</span>)
        }
      }

      // show ellipsis between first two and current region and last two and current region
      // if (totalPages > maxPagingButtons && ((i === 1 && page > 3) || (i === totalPages - 3)) {
      //   pageItems.push(<span>...</span>)
      // }
    }

    return (
      <div>
        { loading }
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
                  <SortIcon color={ list.get('sortCol') == col.db ? 'black' : 'white' }
                    style={{ height: 18, width: 18, position: 'relative', top: '4px', left: '4px', transform: list.get('sortDir') === 'asc' ? 'scale(1, -1)' : '' }} />
                </TableHeaderColumn>
              )) }
            </TableRow>
          </TableHeader>
          <TableBody
            displayRowCheckbox={this.state.showCheckboxes}
            deselectOnClickaway={this.state.deselectOnClickaway}
            showRowHover={this.state.showRowHover}
            stripedRows={this.state.stripedRows}>
            {list.get('items').map((item) => (
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
  list: React.PropTypes.object.isRequired,
  columns: React.PropTypes.array.isRequired
}
