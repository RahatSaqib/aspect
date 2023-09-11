import React from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import identity from 'lodash/identity'
import isEqual from 'lodash/isEqual'
import pickBy from 'lodash/pickBy'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose, withProps, withHandlers, lifecycle, setPropTypes, defaultProps } from 'recompose'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import StyledDropdown from '../../../oldComponents/shared/StyledDropdown'
import { sanitizeFiltersStringBy } from '../../../oldComponents/utils'
import { fetchTasks } from '../../../store/TaskRedux'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import messages from './messages'
import { TaskDataTable, TaskDataTableHead, TaskDataTableRow } from './TaskDataTable'
import styles from './TaskList.css'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = {
  contactNameOrEmail: true,
}

export const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['issueCategory', 'site', 'time'],
})
export const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
export const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

function mergeFilterOptions(searchParams, filterOptions = {}) {
  const options = pickBy(filterOptions, identity)
  Object.keys(options).forEach(key => {
    const param = searchParams.get(key)
    const option = options[key]
    if (param && isEqual(param, option)) {
      return
    }
    searchParams.set(key, option)
  })
  return searchParams
}

const enhance = compose(
  setPropTypes({
    baseFilterOptions: PropTypes.object,
  }),
  defaultProps({
    baseFilterOptions: {},
  }),
  withProps(
    makeSortPageSelector({
      sortCol: 'time',
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
      items: state.task.items,
      table: state.task.table,
      countByAlert: state.task.countByAlert,
    }),
    {
      fetchTasks,
    }
  ),
  withHandlers({
    onInitialLoad:
      ({ location, fetchTasks, sortCol, sortDir, pageAt, pageSize, filterOptions }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          fetchTasks(mergeFilterOptions(filtersParams, filterOptions), sortCol, sortDir, pageAt, pageSize)
        }
      },

    onAlertTypeClick:
      ({ navigate, location, filterOptions }) =>
      ({
        currentTarget: {
          dataset: { alertType },
        },
      }) => {
        const searchParams = new URLSearchParams(location.search)
        const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
        filtersParams.set('alertType', alertType)
        searchParams.set('filters', mergeFilterOptions(filtersParams, filterOptions))

        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },

    onIssueCategoryChange:
      ({ navigate, location, filterOptions }) =>
      ({ target: { value: issueCategory } }) => {
        const searchParams = new URLSearchParams(location.search)
        const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
        filtersParams.set('issueCategory', issueCategory)
        searchParams.set('filters', mergeFilterOptions(filtersParams, filterOptions))

        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },

    onRowClick:
      ({ navigate }) =>
      ({
        currentTarget: {
          dataset: { taskId },
        },
      }) =>
        navigate(`/task-list/${taskId}`),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { location, navigate, filterOptions } = this.props
      const { sanitized, value: searchParams } = searchSanitizer(location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')

      if (sanitized || filtersSanitized) {
        searchParams.set('filters', mergeFilterOptions(filtersParams, filterOptions))
        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  }),
  withProps(({ location, filterOptions }) => {
    const searchParams = new URLSearchParams(location.search)
    let filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    filtersParams = mergeFilterOptions(filtersParams, filterOptions)

    return {
      alertType: filtersParams.get('alertType') || 'all',
      issueCategory: filtersParams.get('issueCategory') || 'all',
    }
  })
)

export const TaskList = ({
  intl,
  navigate,
  location,
  table,
  items,
  filterOptions,
  // --- injected by recompose ---

  issueCategory,
  onIssueCategoryChange,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onRowClick,
}) => {
  const { formatMessage } = useI18n()
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={formatMessage(messages.tasksTitle)} />
      <div className={cssClasses('FiltersGroup')}>
        <div className={cssClasses('FiltersGroup__Child', 'FiltersGroup__Child--dropdown')}>
          <StyledDropdown
            value={issueCategory}
            source={[
              {
                value: 'all',
                label: formatMessage(messages.taskListOptionsAllTopics),
              },
              {
                value: 'device',
                label: formatMessage(messages.taskListOptionsDevice),
              },
              {
                value: 'reagent',
                label: formatMessage(messages.taskListOptionsReagent),
              },
              {
                value: 'data',
                label: formatMessage(messages.taskListOptionsData),
              },
              {
                value: 'connectivity',
                label: formatMessage(messages.taskListOptionsConnectivity),
              },
            ]}
            onChange={onIssueCategoryChange}
          />
        </div>
      </div>
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
        {items.currentIdList.isEmpty() && <BrowseEmptyList isLoadingData={table.loading} />}
        {!items.currentIdList.isEmpty() && (
          <TaskDataTable className={cssClasses('TaskDataTable')}>
            <TaskDataTableHead
              navigate={navigate}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
                {
                  key: 'icon',
                },
                {
                  key: 'issueCategory',
                  label: formatMessage(messages.topic),
                  sortable: true,
                },
                {
                  key: 'site',
                  label: formatMessage(messages.site),
                  sortable: true,
                },
                {
                  key: 'time',
                  label: formatMessage(messages.time),
                  sortable: true,
                },
              ]}
            />
            <tbody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(task => {
                  const filtersParams = new URLSearchParams(filterOptions)
                  const aggreListQuerystring = new URLSearchParams({
                    filters: filtersParams.toString(),
                    categoryId: task.get('issueCategoryId'),
                    date: task.get('time'),
                    alertTemplateId: task.get('alertTemplateId'),
                  })
                  return (
                    <TaskDataTableRow
                      key={task.get('id')}
                      intl={intl}
                      messages={messages}
                      task={task}
                      onClick={onRowClick}
                      data-task-id={
                        task.get('issueCount') > 1
                          ? `aggre-list?${aggreListQuerystring.toString()}`
                          : `${task.get('id')}`
                      }
                    />
                  )
                })}
            </tbody>
          </TaskDataTable>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            navigate={navigate}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={table.total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </DataTableCard>
    </div>
  )
}

export default enhance(TaskList)
