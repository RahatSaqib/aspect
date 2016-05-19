import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import LinearProgress from 'material-ui/LinearProgress'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table'

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
                    stripedRows: false,
                    sortDirection: 'asc' }
  }

  componentDidMount() {
    this.props.handleFetch(this.props.sortCol, this.state.sortDir)
  }

  handleSort(col){

    let newSort = this.state.sortDirection == 'asc' ? 'desc' : 'asc'

    this.setState({ sortDirection:  newSort})

    this.props.handleFetch(col, newSort)

  }

  render() {

    let loading = this.props.loading ? <LinearProgress /> : <div style={ {margin: 0, padding: 0, height: 4 }}>&nbsp;</div>

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
                <TableHeaderColumn key={col.db} tooltip={col.tooltip}><span style={{cursor: 'pointer'}} onClick={() => { this.handleSort(col.db) }}>{col.title}</span></TableHeaderColumn>
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
                <TableRowColumn key={item.get(col.db)}>{item.get(col.db)}</TableRowColumn>
                ))}
              </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    )
  }
}

DataTable.propTypes = {
  loading: React.PropTypes.bool.isRequired
}
