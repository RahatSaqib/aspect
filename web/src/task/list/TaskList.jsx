import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import { Button } from 'react-toolbox/lib/button'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
// import FiltersPanel from '../../filter/popover/FiltersPanel'
import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'
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

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['topic', 'site', 'time'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
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
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchTasks(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onAlertTypeClick: ({ history, location }) => ({
      currentTarget: { dataset: { alertType } },
    }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      filtersParams.set('alertType', alertType)
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onTopicChange: ({ history, location }) => topic => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      filtersParams.set('topic', topic)
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
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
  }),
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    return {
      alertType: filtersParams.get('alertType') || 'all',
      topic: filtersParams.get('topic') || 'all',
    }
  })
)

export const TaskList = ({
  intl,
  history,
  location,
  table,
  items,
  countByAlert,
  // --- injected by recompose ---
  alertType,
  topic,
  onAlertTypeClick,
  onTopicChange,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.tasksTitle)} />
    <div className={cssClasses('FiltersGroup')}>
      <ButtonGroup adjacent className={cssClasses('FiltersGroup__Child')}>
        <Button
          primary
          raised
          inverse={alertType !== 'mine'}
          label="My alerts"
          data-alert-type="mine"
          onClick={onAlertTypeClick}
        />
        <Button
          className={cssClasses('Button--mini')}
          primary
          raised
          label={`${countByAlert.get('mine', 0)}`}
        />
      </ButtonGroup>
      <ButtonGroup adjacent className={cssClasses('FiltersGroup__Child')}>
        <Button
          primary
          raised
          inverse={alertType !== 'snoozed'}
          label="Snoozed"
          data-alert-type="snoozed"
          onClick={onAlertTypeClick}
        />
        <Button
          className={cssClasses('Button--mini')}
          primary
          raised
          label={`${countByAlert.get('snoozed', 0)}`}
        />
      </ButtonGroup>
      <ButtonGroup adjacent className={cssClasses('FiltersGroup__Child')}>
        <Button
          primary
          raised
          inverse={alertType !== 'all'}
          label="All"
          data-alert-type="all"
          onClick={onAlertTypeClick}
        />
        <Button
          className={cssClasses('Button--mini')}
          primary
          raised
          label={`${countByAlert.get('total', 0)}`}
        />
      </ButtonGroup>
      <div
        className={cssClasses(
          'FiltersGroup__Child',
          'FiltersGroup__Child--dropdown'
        )}
      >
        <StyledDropdown
          value={topic}
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
              value: 'consumable',
              label: 'Consumable',
            },
            {
              value: 'health',
              label: 'Health',
            },
            {
              value: 'site',
              label: 'Sites',
            },
          ]}
          onChange={onTopicChange}
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
    <DataTableCard>
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
                key: 'topic',
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
              {
                key: 'alert',
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(task => (
              <TaskDataTableRow
                key={task.get('id')}
                intl={intl}
                messages={messages}
                task={task}
              />
            ))}
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
