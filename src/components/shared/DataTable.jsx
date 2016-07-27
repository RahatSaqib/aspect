import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

// Material-UI
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn, TableFooter } from 'material-ui/Table'
import LinearProgress from 'material-ui/LinearProgress'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import SortIcon from 'material-ui/svg-icons/content/sort'
import IconButton from 'material-ui/IconButton'
import Arrow from 'material-ui/svg-icons/av/play-arrow'

import theme from './../../theme'

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

    for (let i = 0; i < totalPages; i++) {
      pageItems.push(<MenuItem key={i} value={i} label={'Page ' + (i + 1) + ' of ' + totalPages} primaryText={'Page ' + (i + 1) } />)
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
              <TableRowColumn style={{ fontSize: '15px', padding: '0 0 25px 0', display: 'none' }}>
                Displaying items { page * this.props.size + 1 } - { (page + 1) * this.props.size } of { this.props.total }
              </TableRowColumn>
              <TableRowColumn colSpan={this.props.columns.length - 1} style={{ textAlign: 'right', padding: '10px 0 20px 0' }} >
                <IconButton className={'pager-arrow pager-arrow-prev'} touch={true} onTouchTap={() => { this.handlePage(page - 1) } } disabled={page === 0}>
                  <Arrow color={theme.palette.primary1Color} />
                </IconButton>
                <DropDownMenu maxHeight={300} value={page} onChange={(e, k) => { this.handlePage(k) } }>
                  { pageItems }
                </DropDownMenu>
                <IconButton className={'pager-arrow'} touch={true} onTouchTap={() => { this.handlePage(page + 1) } } disabled={ page + 1 >= totalPages}>
                  <Arrow color={theme.palette.primary1Color} />
                </IconButton>
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
