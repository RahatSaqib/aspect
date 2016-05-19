import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import LinearProgress from 'material-ui/LinearProgress'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn, TableFooter } from 'material-ui/Table'
import SortIcon from 'material-ui/svg-icons/content/sort'

export class DataTable extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = {  height: 'inherit',
                    fixedHeader: true,
                    fixedFooter: false,
                    selectable: false,
                    multiSelectable: false,
                    showCheckboxes: false,
                    enableSelectAll: false,
                    showRowHover: true,
                    stripedRows: false }
  }

  componentDidMount() {
    this.props.handleFetch(this.props.sortCol, this.props.sortDir, this.props.page, this.props.size)
  }

  handleSort(col){

    // only change sort direction if column that we're currently sorting on is clicked
    let newSort = this.props.sortCol === col ? (this.props.sortDir === 'asc' ? 'desc' : 'asc') : this.props.sortDir

    this.props.handleFetch(col, newSort, this.props.page, this.props.size)

  }

  handlePage(page){

    this.props.handleFetch(this.props.sortCol, this.props.sortDir, page, this.props.size)
  }

  render() {

    let loading = this.props.loading ?
                  <LinearProgress /> :
                  <div style={ {margin: 0, padding: 0, height: 4 }}>&nbsp;</div>

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
              {this.props.columns.map( (col) => (
                <TableHeaderColumn key={col.db} tooltip={col.tooltip}>
                  <span style={{cursor: 'pointer'}} onClick={() => { this.handleSort(col.db) }}>
                    {col.title}
                  </span>
                  <SortIcon color={ this.props.sortCol == col.db ? 'black' : 'white' }
                            style={{ height: 18, width: 18, position: 'relative', top: '4px', transform: this.props.sortDir === 'asc' ? 'scale(1, -1)' : '' }} />
                </TableHeaderColumn>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody
            displayRowCheckbox={this.state.showCheckboxes}
            deselectOnClickaway={this.state.deselectOnClickaway}
            showRowHover={this.state.showRowHover}
            stripedRows={this.state.stripedRows}>
            {this.props.items.map( (item) => (
              <TableRow key={item.get('id')}>
              {this.props.columns.map( (col) => (
                <TableRowColumn key={item.get(col.db)}>
                  {item.get(col.db)}
                </TableRowColumn>
                ))}
              </TableRow>
              ))}
          </TableBody>
          <TableFooter adjustForCheckbox={true}>
            <TableRow>
              <TableRowColumn colSpan={this.props.columns.length - 1} style={{ textAlign: 'right', padding: '0 30px 15px 0' }}>
              Page { this.props.page + 1 } of { this.props.total / this.props.size }
              <br/>
              Displaying items { this.props.page * this.props.size + 1 } - { (this.props.page + 1) * this.props.size } of { this.props.total } items
              <br/>
              <button onClick={() => {this.handlePage(0)}} >1</button>
              <button onClick={() => {this.handlePage(1)}} >2</button>
              <button onClick={() => {this.handlePage(2)}} >3</button>
              </TableRowColumn>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  }
}

DataTable.propTypes = {
  loading: React.PropTypes.bool.isRequired
}
