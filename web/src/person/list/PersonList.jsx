import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import DataTableProgressBar from '../../globals/components/DataTableProgressBar'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredPersons } from '../PersonRedux'
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

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.person.items,
      table: state.person.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredPersons,
      configureListFilter,
    })
  ),
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredPersons, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredPersons(
        {},
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { personId } },
    }) => history.push(`/browse/person/${personId}`),
    onPageChange: ({ fetchListFilteredPersons, table }) => nextPage =>
      fetchListFilteredPersons(
        {},
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredPersons, table }) => nextPageSize =>
      fetchListFilteredPersons(
        {},
        table.sortCol,
        table.sortDir,
        0,
        nextPageSize
      ),
  }),
  lifecycle({
    componentWillMount() {
      this.props.configureListFilter({
        geography: true,
        contactNameOrEmail: true,
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

export const PersonList = ({
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
      title={intl.formatMessage(messages.contactsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.contactsTitle)} />
    <BrowseFilters history={history} location={location} intl={intl} />
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <Card className={cssClasses('Card')}>
        <DataTableProgressBar
          mode={table.loading ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
        />
        <PersonDataTable
          selectable={false}
          className={cssClasses('PersonDataTable')}
        >
          <PersonDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
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
        </PersonDataTable>
        <TablePaginator
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

export default enhance(PersonList)
