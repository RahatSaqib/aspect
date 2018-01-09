import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helmet from 'react-helmet'
import FaArrowUp from 'react-icons/lib/fa/arrow-up'

import { makeSortPageSelector } from '../../shared/selectors/searchParams'
import DetailBackBar from '../../globals/components/DetailBackBar'
import { Unit } from '../../components/pureGrids'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import {
  searchSanitizer,
  filtersSanitizer,
  filtersFromLocation,
} from '../list/TaskList'
import {
  TaskDataTable,
  TaskDataTableHead,
  TaskDataTableRow,
} from '../list/TaskDataTable'
import { fetchTasks } from '../TaskRedux'

const cssClasses = classnames.bind(require('./TaskAggre.css'))

const messages = defineMessages({
  taskAggreTitle: {
    id: 'pages.TaskAggre.title',
    defaultMessage: 'Task',
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
  paginatorStatus: {
    id: 'pages.TaskList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# task}
      other {# tasks}
    }`,
  },
})

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

    onBackClick: ({ history }) => () => {
      history.goBack()
    },

    onRowClick: ({ history }) => ({ currentTarget: { dataset: { taskId } } }) =>
      history.push(`/task-list/${taskId}`),
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
  })
)

export const TaskAggre = ({
  intl,
  history,
  location,
  match,
  table,
  items,
  // --- injected by recompose ---
  onBackClick,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onRowClick,
}) => (
  <div>
    <Helmet title={intl.formatMessage(messages.taskAggreTitle)} />
    <DetailBackBar
      history={history}
      location={location}
      match={match}
      onBackClick={onBackClick}
      title="TB positive results"
    />
    <section className={cssClasses('Section')}>
      <Unit lg="1-4">
        <legend className={cssClasses('Summary__Legend')}>Site</legend>
        <div>
          <span className={cssClasses('Summary__Item')}>
            Kampala Lab
            <Link
              to="/browse/site"
              className={cssClasses('Summary__Item__Link')}
            >
              <FaArrowUp
                className={cssClasses('Summary__Item__Link__FaArrowUp')}
              />
            </Link>
          </span>
        </div>
      </Unit>
      <Unit lg="1-2">
        <legend className={cssClasses('Summary__Legend')}>Devices</legend>
        <div>
          <span className={cssClasses('Summary__Item')}>
            TB Device Kampala 1
            <Link
              to="/browse/device"
              className={cssClasses('Summary__Item__Link')}
            >
              <FaArrowUp
                className={cssClasses('Summary__Item__Link__FaArrowUp')}
              />
            </Link>
          </span>
          <span className={cssClasses('Summary__Item')}>
            TB Device Kampala 2
            <Link
              to="/browse/device"
              className={cssClasses('Summary__Item__Link')}
            >
              <FaArrowUp
                className={cssClasses('Summary__Item__Link__FaArrowUp')}
              />
            </Link>
          </span>
        </div>
      </Unit>
      <Unit lg="1-4">
        <legend className={cssClasses('Summary__Legend')}>More</legend>
        <div>
          <span className={cssClasses('Summary__Item')}>
            Alert settings
            <Link
              to="/task/detail"
              className={cssClasses('Summary__Item__Link')}
            >
              <FaArrowUp
                className={cssClasses('Summary__Item__Link__FaArrowUp')}
              />
            </Link>
          </span>
        </div>
      </Unit>
    </section>
    <section className={cssClasses('Section')}>
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
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
                {
                  key: 'icon',
                },
                {
                  key: 'topic',
                  label: intl.formatMessage(messages.topic),
                },
                {
                  key: 'site',
                  label: intl.formatMessage(messages.site),
                },
                {
                  key: 'time',
                  label: intl.formatMessage(messages.time),
                },
                {
                  key: 'alert',
                },
              ]}
            />
            {items.currentIdList
              .map(id =>
                items.byId.get(id).merge({
                  /* FIXME: actual impl */
                  alertType: 'mine',
                  topic: 'health',
                  title: 'TB',
                  alertCount: 0,
                  message: 'positive results',
                  site: 'Kampala Lab',
                  notificationCount: 0,
                })
              )
              .map(task => (
                <TaskDataTableRow
                  key={task.get('id')}
                  intl={intl}
                  messages={messages}
                  task={task}
                  onClick={onRowClick}
                  data-task-Id="detail"
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
    </section>
  </div>
)

export default enhance(TaskAggre)
