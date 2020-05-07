import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import PropTypes from 'prop-types'
import {
  compose,
  withProps,
  withHandlers,
  lifecycle,
  setPropTypes,
  defaultProps,
} from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
/* import TableBody from '@material-ui/core/TableBody'

import AspectButton from '../../components/shared/AspectButton' */
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
// import FiltersPanel from '../../filter/popover/FiltersPanel'
// import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import StyledDropdown from '../../components/shared/StyledDropdown'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchTasks } from '../TaskRedux'
import {
  TaskDataTable,
  TaskDataTableHead,
  TaskDataTableRow,
} from './TaskDataTable'

const cssClasses = classnames.bind(require('./TaskList.css'))

const messages = defineMessages({
  tasksTitle: {
    id: 'pages.TaskList.title',
    defaultMessage: 'Tasks',
  },
  topic: {
    id: 'pages.TaskList.topic',
    defaultMessage: 'Topic',
  },
  site: {
    id: 'pages.TaskList.site',
    defaultMessage: 'Site',
  },
  time: {
    id: 'pages.TaskList.time',
    defaultMessage: 'Time',
  },
  alertCount: {
    id: 'pages.TaskList.alertCount',
    defaultMessage: `{alertCount, plural,
      one {# alert}
      other {# alerts}
    }`,
  },
  paginatorStatus: {
    id: 'pages.TaskList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# task}
      other {# tasks}
    }`,
  },
})

const FILTERS_CONFIG = {
  contactNameOrEmail: true,
}

export const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['issueCategory', 'site', 'time'],
})
export const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
export const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

function mergeFilterOptions(searchParams, filterOptions = {}) {
  const options = _.pickBy(filterOptions, _.identity)
  Object.keys(options).forEach(key => {
    const param = searchParams.get(key)
    const option = options[key]
    if (param && _.isEqual(param, option)) {
      return
    }
    searchParams.set(key, option)
  })
  return searchParams
}

const enhance = compose(
  injectIntl,
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
    bindActionCreators.bind(null, {
      fetchTasks,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchTasks,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
      filterOptions,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchTasks(
          mergeFilterOptions(filtersParams, filterOptions),
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
    },

    onAlertTypeClick: ({ history, location, filterOptions }) => ({
      currentTarget: {
        dataset: { alertType },
      },
    }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      filtersParams.set('alertType', alertType)
      searchParams.set(
        'filters',
        mergeFilterOptions(filtersParams, filterOptions)
      )

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onIssueCategoryChange: ({ history, location, filterOptions }) => ({
      target: { value: issueCategory },
    }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      filtersParams.set('issueCategory', issueCategory)
      searchParams.set(
        'filters',
        mergeFilterOptions(filtersParams, filterOptions)
      )

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { taskId },
      },
    }) => history.push(`/task-list/${taskId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { location, history, filterOptions } = this.props
      const { sanitized, value: searchParams } = searchSanitizer(location)
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized || filterOptions) {
        searchParams.set(
          'filters',
          mergeFilterOptions(filtersParams, filterOptions)
        )

        history.replace({
          ...location,
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
  history,
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
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.tasksTitle)} />
    <div className={cssClasses('FiltersGroup')}>
      {/*
      <ButtonGroup adjacent className={cssClasses('FiltersGroup__Child')}>
        <AspectButton
          color="primary"
          variant="contained"

          inverse={alertType !== 'mine'}
          data-alert-type="mine"
          onClick={onAlertTypeClick}
        >
          My alerts
        </AspectButton>
        <AspectButton
          className={cssClasses('Button--mini')}
          color="primary"
          variant="contained"
        >
          {`${countByAlert.get('mine', 0)}`}
        </AspectButton>
      </ButtonGroup>
      <ButtonGroup adjacent className={cssClasses('FiltersGroup__Child')}>
        <AspectButton
          color="primary"
          variant="contained"
          inverse={alertType !== 'snoozed'}
          data-alert-type="snoozed"
          onClick={onAlertTypeClick}
        >
          Snoozed
        </AspectButton>
        <AspectButton
          className={cssClasses('Button--mini')}
          color="primary"
          variant="contained"
        >
          {`${countByAlert.get('snoozed', 0)}`}
        </AspectButton>
      </ButtonGroup>

      <ButtonGroup adjacent className={cssClasses('FiltersGroup__Child')}>
        <AspectButton
          color="primary"
          variant="contained"
          inverse={alertType !== 'all'}
          data-alert-type="all"
          onClick={onAlertTypeClick}
        >
          All
        </AspectButton>
        <AspectButton
          className={cssClasses('Button--mini')}
          color="primary"
          variant="contained"
        >
          {`${countByAlert.get('total', 0)}`}
        </AspectButton>
      </ButtonGroup>
      */}
      <div
        className={cssClasses(
          'FiltersGroup__Child',
          'FiltersGroup__Child--dropdown'
        )}
      >
        <StyledDropdown
          value={issueCategory}
          source={[
            {
              value: 'all',
              label: 'All topics',
            },
            {
              value: 'device',
              label: 'Device',
            },
            {
              value: 'reagent',
              label: 'Reagent',
            },
            {
              value: 'data',
              label: 'Data',
            },
            {
              value: 'connectivity',
              label: 'Connectivity',
            },
          ]}
          onChange={onIssueCategoryChange}
        />
      </div>
      {/* <div className={cssClasses('FiltersGroup__Child')}>
        <FiltersPanel
          history={history}
          location={location}
          intl={intl}
          config={{}}
          filters={{}}
          onChangeFilters={_.noop}
          disabled
        />
      </div> */}
    </div>
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <TaskDataTable
          selectable={false}
          className={cssClasses('TaskDataTable')}
        >
          <TaskDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'icon',
              },
              {
                key: 'issueCategory',
                label: intl.formatMessage(messages.topic),
                sortable: true,
              },
              {
                key: 'site',
                label: intl.formatMessage(messages.site),
                sortable: true,
              },
              {
                key: 'time',
                label: intl.formatMessage(messages.time),
                sortable: true,
              },
            ]}
          />
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
        </TaskDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
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

export default enhance(TaskList)
