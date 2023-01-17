import React, { useEffect } from 'react'
import { TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { Helmet } from 'react-helmet'
import { defineMessages } from 'react-intl'
import { connect, useSelector } from 'react-redux'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import DetailHeader from '../../../components/DetailHeader'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage, commonDefinitions } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import requirePermissions, { isPermittedUser } from '../../../oldComponents/shared/requirePermissions'
import { fetchPersons, exportContacts } from '../../../store/PersonRedux'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import { PersonDataTable, PersonDataTableHead, PersonDataTableRow } from './PersonDataTable'
import styles from './PersonList.css'

const cssClasses = classnames.bind(styles)

const messages = {
  ...commonDefinitions,
  ...defineMessages({
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
    paginatorStatus: {
      id: 'pages.PersonList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# contact}
      other {# contacts}
    }`,
    },
    tags: {
      id: 'pages.PersonList.tags',
      defaultMessage: 'Tags',
    },
    addContact: {
      id: 'pages.PersonList.addContact',
      defaultMessage: 'New Contact',
    },
    disable: {
      id: 'pages.PersonList.disable',
      defaultMessage: 'Do you want to disable',
    },
    enable: {
      id: 'pages.PersonList.enable',
      defaultMessage: 'Do you want to enable',
    },
    yes: {
      id: 'pages.PersonList.confirm',
      defaultMessage: 'Yes',
    },
    cancel: {
      id: 'pages.PersonList.cancel',
      defaultMessage: 'Cancel',
    },
    enableDisable: {
      id: 'pages.PersonList.enableDisable',
      defaultMessage: 'Enable/Disable User',
    },
  }),
}

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { actions: true, requiredPermissions: [] },
  {
    contactNameOrEmail: true,
    requiredPermissions: [],
  },
  { contactStatus: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'level', 'state', 'lga'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    }),
    ({ location }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      return {
        filters: getFilters(filtersParams),
      }
    }
  ),
  connect(
    state => ({
      items: state.person.items,
      table: state.person.table,
      userPermissions: state.user.jwt.permissions,
      user: state.user,
    }),
    bindActionCreators.bind(null, {
      fetchPersons,
      exportContacts,
    })
  ),
  withHandlers({
    onInitialLoad:
      ({ location, fetchPersons, sortCol, sortDir, pageAt, pageSize }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          fetchPersons(filtersParams, sortCol, sortDir, pageAt, pageSize)
        }
      },

    onExcelClick:
      ({ location, exportContacts, sortCol, sortDir, pageAt, table }) =>
      formatType => {
        const format = formatType
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          exportContacts(
            filtersParams,
            sortCol,
            sortDir,
            pageAt,
            table.get('total') > 0 ? table.get('total') : 1,
            format,
            'contacts'
          )
        }
      },

    onRowClick:
      ({ navigate }) =>
      ({
        currentTarget: {
          dataset: { personId },
        },
      }) =>
        navigate(`/browse/person/${personId}`),

    showNewContactPage:
      ({ navigate }) =>
      event => {
        event.stopPropagation()
        navigate('/browse/person/add')
      },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(this.props.location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)
        this.props.navigate(
          {
            ...this.props.location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
      const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, this.props.userPermissions)
      this.setState({
        reducedFilters,
      })
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const PersonList = ({
  navigate,
  location,
  table,
  items,
  // --- injected by recompose ---
  onExcelClick,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onRowClick,
  reducedFilters,
  showNewContactPage,
  user,
}) => {
  const AddNewButton = requirePermissions({
    permissions: ['person:edit'],
  })(AspectButton)
  const { formatMessage } = useI18n()

  const { permissions: userPermissions } = useSelector(({ user }) => user.toJS().jwt)

  const editor = user.toJS()
  const isEditAllow = isPermittedUser(userPermissions, {
    required: ['person:edit'],
  })

  useEffect(() => {
    const searchParams = new URLSearchParams()
    searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')
    const filtersParams = new URLSearchParams(searchParams.get('filters'))
    if (!filtersParams.has('contactStatus')) {
      filtersParams.set('contactStatus', 0)
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <DetailHeader name={formatMessage(messages.contactsTitle)} disableBack>
        <BrowseFilters navigate={navigate} location={location} config={reducedFilters}>
          <AddNewButton type="button" color="primary" variant="contained" browseButton onClick={showNewContactPage}>
            {formatMessage(messages.addContact)}
          </AddNewButton>
        </BrowseFilters>
      </DetailHeader>
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.contactsTitle)} />
        <DataTableCard key={`DataTableCard--table-${location.key}`}>
          <DataTableProgressBar disabled={!table.loading} />
          {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
          <AspectExportListButton onExport={onExcelClick} visible={!items.currentIdList.isEmpty()} />

          {!items.currentIdList.isEmpty() && (
            <PersonDataTable className={cssClasses('PersonDataTable')}>
              <PersonDataTableHead
                navigate={navigate}
                location={location}
                sortColumnKey={sortCol}
                sortColumnDir={sortDir}
                columns={[
                  { key: 'name', label: formatMessage(messages.personName), sortable: true },
                  { key: 'level', label: formatMessage(messages.level), sortable: true },
                  { key: 'state', label: getCustomMessage(messages, 'state', user), sortable: true },
                  { key: 'lga', label: getCustomMessage(messages, 'lga', user), sortable: true },
                  { key: 'tags', label: formatMessage(messages.tags), sortable: true },
                  isEditAllow && { key: 'actions', label: formatMessage(messages.enableDisable), sortable: false },
                ]}
              />
              <TableBody>
                {items.currentIdList
                  .map(id => items.byId.get(id))
                  .map(person => (
                    <PersonDataTableRow
                      key={person.get('id')}
                      person={person}
                      onClick={onRowClick}
                      data-person-id={person.get('id')}
                      personEditPermission={isEditAllow && editor?.userId !== person.get('id')}
                    />
                  ))}
              </TableBody>
            </PersonDataTable>
          )}
          {!items.currentIdList.isEmpty() && (
            <BrowseTablePaginator
              navigate={navigate}
              location={location}
              paginatorStatus={messages.paginatorStatus}
              total={table.total}
              pageAt={pageAt}
              pageSize={pageSize}
            />
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default enhance(PersonList)
