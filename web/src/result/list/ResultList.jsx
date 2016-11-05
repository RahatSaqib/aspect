// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { withRouter } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'

// Our own imports
import { DataTable } from '../../components/shared/DataTable'
import { fetchResults } from '../ResultRedux'
import styles from './ResultList.css'
import { fetchAssays } from '../../assay/AssayRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

const messages = defineMessages({
  title: {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results'
  },
  endedOn: {
    id: 'pages.ResultList.EndedOn',
    defaultMessage: 'Test Date'
  },
  deviceName: {
    id: 'pages.ResultList.deviceName',
    defaultMessage: 'Device'
  },
  sampleId: {
    id: 'pages.ResultList.sampleId',
    defaultMessage: 'Sample ID'
  },
  assayId: {
    id: 'pages.ResultList.assayId',
    defaultMessage: 'Assay'
  },
  patiendId: {
    id: 'pages.ResultList.patiendId',
    defaultMessage: 'Patient ID'
  },
  resultCategoryCopiesMl: {
    id: 'pages.ResultList.resultCategoryHiv',
    defaultMessage: 'HIV'
  }
})

export class ResultList extends PureComponent {

  static propTypes = {
    fetchAssays: PropTypes.func.isRequired,
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired
  }

  state = {
    filters: this.props.table.get('filters')
  }

  handleItemIdSelection = (resultId) => {
    this.props.router.push(`/result/${resultId}`)
  }

  filterResultsChange = (key, value, callback) => {
    this.setState({ filters: this.state.filters.set(key, value) }, callback)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.fetchResults(this.state.filters, undefined, undefined, undefined, undefined)
  }

  handleAssayChange = (e, i, assayId) => {

    // finally, update state and submit
    this.setState({ filters: this.state.filters.set('assayId', assayId) },
                  () => this.handleSubmit(e))
  }

  resetResults = () => {
    this.setState({ filters: this.state.filters.set('sampleId', '').set('assayId', null) })
    this.props.fetchResults()
  }

  componentDidMount(){
    const { fetchAssays, assays } = this.props
    fetchAssays(false, assays)
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  render() {
    const { intl, assays } = this.props
    const { formatMessage, formatDate } = intl

    // load assay dropdown
    const assaysLoading = assays ? assays.get('loading') : false
    const validAssays = assays ? assays.get('items').filter(a => a.get('hasResults')) : []

    let columns = [ { db: 'endedOn', title: formatMessage(messages.endedOn), format: (data) => formatDate(data) },
                    { db: 'deviceName', title: formatMessage(messages.deviceName) },
                    { db: 'sampleId', title: formatMessage(messages.sampleId) },
                    { db: 'patientId', title: formatMessage(messages.patiendId) }]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={styles.Toolbar} >
            <ToolbarGroup firstChild={true}>
              <TextField
                value={this.state.filters.get('sampleId')}
                id="sampleId"
                onChange={ (e, v) => this.filterResultsChange('sampleId', v) }
                className={styles['Toolbar__TextField--filter']}
                hintText="Filter by Sample ID"
              />
              <ForkedSelectField name="assayId"
                      style={{ margin: '5px 0 0 15px' }}
                      value={this.state.filters.get('assayId')}
                      label={formatMessage(messages.assayId)}
                      hintText={formatMessage(messages.assayId)}
                      disabled={assaysLoading || _.isEmpty(validAssays)}
                      onChange={ (e, i, v) => { this.handleAssayChange(e, i, v) } }>
                      {
                        validAssays.map(assay =>
                          <MenuItem key={assay.get('id')} value={assay.get('id')} primaryText={assay.get('name')} />)
                      }
              </ForkedSelectField>
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className={styles.Toolbar__MenuItem} onTouchTap={ this.resetResults } />
                <MenuItem primaryText="Export to Excel" className={styles.Toolbar__MenuItem} />
                <MenuItem primaryText="Export to CSV" className={styles.Toolbar__MenuItem} />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>
        <DataTable
          selectable
          handleItemIdSelection={ this.handleItemIdSelection }
          handleFetch={ this.props.fetchResults }
          items={ this.props.items }
          table={ this.props.table }
          columns={ columns }
          intl={ intl }
          messages={ messages }
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    items: state.result.items,
    table: state.result.table,
    assays: state.assay
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchResults, fetchAssays }, dispatch)
}

export const ResultListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ResultList)
