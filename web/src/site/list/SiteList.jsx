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
import { fetchListFilteredSites } from '../SiteRedux'

const cssClasses = classnames.bind(require('./SiteList.css'))

const messages = defineMessages({
  title: {
    id: 'pages.SiteList.title',
    defaultMessage: 'Sites',
  },
  siteName: {
    id: 'pages.SiteList.siteName',
    defaultMessage: 'Name',
  },
  state: {
    id: 'pages.SiteList.state',
    defaultMessage: 'State',
  },
  lga: {
    id: 'pages.SiteList.lga',
    defaultMessage: 'County',
  },
  totalDevices: {
    id: 'pages.SiteList.totalDevices',
    defaultMessage: 'Number of Devices',
  },
  externalId: {
    id: 'pages.SiteList.externalId',
    defaultMessage: 'Facility Code',
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
      items: state.site.items,
      table: state.site.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredSites,
      configureListFilter,
    })
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredSites: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  })
)

export class SiteList extends PureComponent {
  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({ geography: true, siteName: true, externalId: true })
  }

  componentDidMount() {
    this.handleFetch()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredSites({}, ...args)
  }

  handleItemIdSelection = siteId => {
    this.props.history.push(`/browse/site/${siteId}`)
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl
    const columns = [
      { db: 'name', title: formatMessage(messages.siteName) },
      { db: 'state', title: formatMessage(messages.state) },
      { db: 'lga', title: formatMessage(messages.lga) },
      { db: 'totalDevices', title: formatMessage(messages.totalDevices) },
      { db: 'externalId', title: formatMessage(messages.externalId) },
    ]

    return (
      <div className={cssClasses('Content')}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.title)} />
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

export default enhance(SiteList)
