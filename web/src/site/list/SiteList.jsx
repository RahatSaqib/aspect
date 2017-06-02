import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import DataTableWithEmptyList
  from '../../components/shared/DataTableWithEmptyList'
import NavTitle from '../../globals/components/NavTitle'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredSites } from '../SiteRedux'
import styles from './SiteList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

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
  filterTemplate: {
    id: 'pages.SiteList.filterTemplate',
    defaultMessage: 'Viewing all sites<GEOGRAPHY><NAME>.',
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
    dispatch =>
      bindActionCreators(
        {
          fetchListFilteredSites,
          configureListFilter,
        },
        dispatch
      )
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
    configureListFilter({ geography: true, siteName: true })
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
    this.props.history.push(`/site/${siteId}`)
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl
    const columns = [
      { db: 'name', title: formatMessage(messages.siteName) },
      { db: 'state', title: formatMessage(messages.state) },
      { db: 'lga', title: formatMessage(messages.lga) },
      { db: 'totalDevices', title: formatMessage(messages.totalDevices) },
    ]

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.title)} />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          filterTemplate={formatMessage(messages.filterTemplate)}
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
