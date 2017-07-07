import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredRouters } from '../RouterRedux'

const cssClasses = classnames.bind(require('./RouterList.css'))

const messages = defineMessages({
  routersTitle: {
    id: 'pages.RouterList.routersTitle',
    defaultMessage: 'Routers',
  },
  routerName: {
    id: 'pages.RouterList.routerName',
    defaultMessage: 'Router Name',
  },
  status: {
    id: 'pages.RouterList.status',
    defaultMessage: 'Status',
  },
  reportingFor: {
    id: 'pages.RouterList.reportingFor',
    defaultMessage: 'Reporting For',
  },
  lastSeen: {
    id: 'pages.RouterList.lastSeen',
    defaultMessage: 'Last Seen',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.router.items,
      table: state.router.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredRouters,
      configureListFilter,
    })
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredRouters: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  })
)

const ROUTER_TABLE_COLUMN_SPACING = 12
const ROUTER_TABLE_NAME_COLUMN_WIDTH = '30%'
const ROUTER_TABLE_STATUS_COLUMN_WIDTH = '15%'

export class RouterList extends PureComponent {
  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  static childContextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  getChildContext() {
    const { muiTheme } = this.context

    return {
      muiTheme: {
        ...muiTheme,
        tableHeaderColumn: {
          // Overrides the style used by <material-ui/Table/TableHeaderColumn /> in <DataTable />
          ...muiTheme.tableHeaderColumn,
          spacing: ROUTER_TABLE_COLUMN_SPACING,
        },
        tableRowColumn: {
          // Overrides the style used by <material-ui/Table/TableRowColumn /> in <DataTable />
          ...muiTheme.tableRowColumn,
          spacing: ROUTER_TABLE_COLUMN_SPACING,
        },
      },
    }
  }

  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({
      geography: true,
      deviceName: true,
      deviceStatus: true,
    })
  }

  componentDidMount() {
    this.handleFetch()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleItemIdSelection = routerId => {
    this.props.history.push(`/browse/router/${routerId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredRouters(
      { hasResults: 0, hasConnectivity: 1 },
      ...args
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage, formatRelative } = intl
    const columns = [
      {
        db: 'name',
        title: formatMessage(messages.routerName),
        extraProps: { style: { width: ROUTER_TABLE_NAME_COLUMN_WIDTH } },
      },
      {
        db: 'status',
        title: formatMessage(messages.status),
        hideOnXs: true,
        extraProps: { style: { width: ROUTER_TABLE_STATUS_COLUMN_WIDTH } },
      },
      {
        db: 'createdOn',
        title: formatMessage(messages.reportingFor),
        hideOnXs: true,
        format: data => formatRelative(data),
      },
      {
        db: 'lastSeen',
        title: formatMessage(messages.lastSeen),
        hideOnXs: true,
        format: data => formatRelative(data),
      },
    ]

    return (
      <div className={cssClasses('Content')}>
        <Helmet
          title={formatMessage(messages.routersTitle)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.routersTitle)} />
        <BrowseFilters
          history={this.props.history}
          location={this.props.location}
          intl={intl}
        />
        <DataTableWithEmptyList
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
        />
      </div>
    )
  }
}

export default enhance(RouterList)
