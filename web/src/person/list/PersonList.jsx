import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchPersons } from '../PersonRedux'
import {
  PersonDataTable,
  PersonDataTableHead,
  PersonDataTableRow,
} from './PersonDataTable'

const cssClasses = classnames.bind(require('./PersonList.css'))

const messages = defineMessages({
  contactsTitle: {
    id: 'pages.PersonList.title',
    defaultMessage: 'Contacts',
  },
  personName: {
    id: 'pages.PersonList.personName',
    defaultMessage: 'Name',
  },
  level: {
    id: 'pages.PersonList.level',
    defaultMessage: 'Job',
  },
  state: {
    id: 'pages.PersonList.state',
    defaultMessage: 'State',
  },
  lga: {
    id: 'pages.PersonList.lga',
    defaultMessage: 'County',
  },
  paginatorStatus: {
    id: 'pages.PersonList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# contact}
      other {# contacts}
    }`,
  },
})

const FILTERS_CONFIG = {
  geography: true,
  state: true,
  lga: true,
  contactNameOrEmail: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'level', 'state', 'lga'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(filtersSanitizer, searchParams => searchParams.get('filters')),
  searchSanitizer
)

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      items: state.person.items,
      table: state.person.table,
    }),
    bindActionCreators.bind(null, {
      fetchPersons,
    })
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchPersons,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchPersons(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onHeadColumnClick: ({ history, location, sortCol, sortDir }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { personId } },
    }) => history.push(`/browse/person/${personId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters'))
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const PersonList = ({
  intl,
  history,
  location,
  table,
  items,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onHeadColumnClick,
  onRowClick,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.contactsTitle)} />
    <NavTitle title={intl.formatMessage(messages.contactsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() &&
        <BrowseEmptyList history={history} location={location} intl={intl} />}
      {!items.currentIdList.isEmpty() &&
        <PersonDataTable
          selectable={false}
          className={cssClasses('PersonDataTable')}
        >
          <PersonDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.personName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'level',
                label: intl.formatMessage(messages.level),
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
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(person =>
              <PersonDataTableRow
                key={person.get('id')}
                intl={intl}
                person={person}
                onClick={onRowClick}
                data-person-Id={person.get('id')}
              />
            )}
        </PersonDataTable>}
      {!items.currentIdList.isEmpty() &&
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />}
    </DataTableCard>
  </div>

export default enhance(PersonList)
