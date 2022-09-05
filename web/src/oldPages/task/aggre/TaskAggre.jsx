import React from 'react'
import classnames from 'classnames/bind'
import queryString from 'query-string'
import { Helmet } from 'react-helmet'
import { FaArrowUp } from 'react-icons/fa'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DetailBackBar from '../../../oldComponents/DetailBackBar'
import { Unit } from '../../../oldComponents/pureGrids'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { getTasksByAlertTemplateAndDate } from '../../../store/TaskRedux'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from '../list/messages'
import { TaskDataTable, TaskDataTableHead, TaskDataTableRow } from '../list/TaskDataTable'
import { searchSanitizer, filtersSanitizer, filtersFromLocation } from '../list/TaskList'
import styles from './TaskAggre.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  injectIntl,
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
      sites: state.task.sites,
      devices: state.task.devices,
      title: state.task.title,
    }),
    bindActionCreators.bind(null, {
      getTasksByAlertTemplateAndDate,
    })
  ),
  withHandlers({
    onInitialLoad:
      ({ location, getTasksByAlertTemplateAndDate, sortCol, sortDir, pageAt, pageSize }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        const taskDetails = queryString.parse(location.search)
        if (!sanitized) {
          getTasksByAlertTemplateAndDate(
            filtersParams,
            sortCol,
            sortDir,
            pageAt,
            pageSize,
            taskDetails.date,
            taskDetails.categoryId,
            taskDetails.alertTemplateId
          )
        }
      },

    onBackClick:
      ({ navigate }) =>
      () => {
        navigate(-1)
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

export const TaskAggre = ({
  intl,
  navigate,
  location,
  table,
  items,
  sites,
  devices,
  title,
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
    <DetailBackBar onBackClick={onBackClick} title={title} />
    <section className={cssClasses('Section')}>
      <Unit lg="1-4">
        <legend className={cssClasses('Summary__Legend')}>Sites</legend>
        <div>
          {sites &&
            !sites.isEmpty() &&
            sites.toArray().map(element => (
              <span className={cssClasses('Summary__Item')}>
                {element.site}
                <Link to={`/browse/site/${element.siteId}`} className={cssClasses('Summary__Item__Link')}>
                  <FaArrowUp className={cssClasses('Summary__Item__Link__FaArrowUp')} />
                </Link>
              </span>
            ))}
        </div>
      </Unit>
      <Unit lg="1-2">
        <legend className={cssClasses('Summary__Legend')}>Devices</legend>
        <div>
          {devices &&
            !devices.isEmpty() &&
            devices.toArray().map(element => (
              <span className={cssClasses('Summary__Item')}>
                {element.device}
                <Link to={`/browse/device/${element.deviceId}`} className={cssClasses('Summary__Item__Link')}>
                  <FaArrowUp className={cssClasses('Summary__Item__Link__FaArrowUp')} />
                </Link>
              </span>
            ))}
        </div>
      </Unit>
    </section>
    <section className={cssClasses('Section')}>
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
        {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
        {!items.currentIdList.isEmpty() && (
          <TaskDataTable className={cssClasses('TaskDataTable')}>
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
              .map(task => (
                <TaskDataTableRow
                  key={task.get('id')}
                  intl={intl}
                  messages={messages}
                  task={task}
                  onClick={onRowClick}
                  data-task-id={`${task.get('id')}`}
                />
              ))}
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
    </section>
  </div>
)

export default enhance(TaskAggre)
