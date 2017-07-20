import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredSites } from '../SiteRedux'
import {
  SiteDataTable,
  SiteDataTableHead,
  SiteDataTableRow,
} from './SiteDataTable'

const cssClasses = classnames.bind(require('./SiteList.css'))

const messages = defineMessages({
  sitesTitle: {
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
  paginatorStatus: {
    id: 'pages.SiteList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# site}
      other {# sites}
    }`,
  },
})

const enhance = compose(
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
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredSites, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredSites(
        {},
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({ currentTarget: { dataset: { siteId } } }) =>
      history.push(`/browse/site/${siteId}`),
    onPageChange: ({ fetchListFilteredSites, table }) => nextPage =>
      fetchListFilteredSites(
        {},
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredSites, table }) => nextPageSize =>
      fetchListFilteredSites({}, table.sortCol, table.sortDir, 0, nextPageSize),
  }),
  lifecycle({
    componentWillMount() {
      this.props.configureListFilter({
        geography: true,
        siteName: true,
        externalId: true,
      })
    },

    componentDidMount() {
      this.props.onPageChange(0)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.listFilter !== nextProps.listFilter) {
        this.props.onPageChange(0)
      }
    },
  })
)

export const SiteList = ({
  intl,
  history,
  location,
  table,
  items,
  onHeadColumnClick,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet
      title={intl.formatMessage(messages.sitesTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.sitesTitle)} />
    <BrowseFilters history={history} location={location} intl={intl} />
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <Card className={cssClasses('Card')}>
        <ProgressBar
          mode={table.loading ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
          className={cssClasses('ProgressBar')}
          theme={{
            indeterminate: cssClasses('ProgressBar--indeterminate'),
          }}
        />
        <SiteDataTable
          selectable={false}
          className={cssClasses('SiteDataTable')}
        >
          <SiteDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.siteName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'state',
                label: intl.formatMessage(messages.state),
                onClick: onHeadColumnClick,
              },
              {
                key: 'lga',
                label: intl.formatMessage(messages.lga),
                onClick: onHeadColumnClick,
              },
              {
                key: 'totalDevices',
                label: intl.formatMessage(messages.totalDevices),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(site =>
              <SiteDataTableRow
                key={site.get('id')}
                intl={intl}
                site={site}
                onClick={onRowClick}
                data-site-Id={site.get('id')}
              />
            )}
        </SiteDataTable>
        <TablePaginator
          className={cssClasses('TablePaginator')}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Card>}
  </div>

export default enhance(SiteList)
