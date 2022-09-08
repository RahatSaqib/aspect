import { stringify } from 'querystring'
import Immutable from 'immutable'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'
import { defineMessages } from 'react-intl'
import { getFilters } from '../oldComponents/filter/utils'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { receiveList, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_TASKS: 'REQUEST_TASKS',
  REQUEST_TASK: 'REQUEST_TASK',
  REQUEST_TASKSBYSTATUS: 'REQUEST_TASKSBYSTATUS',
  RECEIVE_TASKS: 'RECEIVE_TASKS',
  RECEIVE_TASK: 'RECEIVE_TASK',
  RECEIVE_TASKSBYSTATUS: 'RECEIVE_TASKSBYSTATUS',
}
//

/*
 * ---------------- Action Creators -----------------
 */
function requestTasks(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_TASKS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function requestTask(id) {
  return {
    type: types.REQUEST_TASK,
    id,
  }
}

function requestTasksByStatus(sortCol, sortDir, page, size, filters, date, categoryId) {
  return {
    type: types.REQUEST_TASKSBYSTATUS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
    date,
    categoryId,
  }
}

function receiveTasks(json) {
  return {
    type: types.RECEIVE_TASKS,
    items: json.data,
    total: json.total,
    countByAlert: json.countByAlert,
  }
}

function receiveTask(json) {
  return {
    type: types.RECEIVE_TASK,
    ...json,
  }
}

function receiveDetailedTasks(json) {
  return {
    type: types.RECEIVE_TASKSBYSTATUS,
    items: json.data,
    total: json.total,
    countByAlert: json.countByAlert,
    title: json.data && json.data.length > 0 ? json.data[0].message : '',
    sites: uniqBy(
      map(json.data, elem => ({ siteId: elem.siteId, site: elem.site })),
      'siteId'
    ),
    devices: uniqBy(
      map(json.data, elem => ({
        deviceId: elem.deviceId,
        device: elem.device,
      })),
      'deviceId'
    ),
  }
}

export function getTasksByAlertTemplateAndDate(
  filtersParams,
  sortCol,
  sortDir,
  page,
  pageSize,
  date,
  categoryId,
  alertTemplateId
) {
  return dispatch => {
    const filters = getFilters(filtersParams)
    dispatch(requestTasksByStatus(sortCol, sortDir, page, pageSize, filters, date, categoryId, alertTemplateId))

    return aspectFetch(
      `/taskbystatus?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        date: new Date(date).toISOString(),
        categoryId,
        alertTemplateId,
        ...filters,
      })}`,
      {
        errorTasks: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.getTasksByStatus.GET.400.title',
                defaultMessage: 'Searching Task Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.getTasksByStatus.GET.default.title',
                defaultMessage: 'Loading Tasks Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveDetailedTasks(json)))
  }
}

export function fetchTask(id) {
  return dispatch => {
    dispatch(requestTask(id))
    return aspectFetch(`/task/${id}`, {
      errorTasks: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchTask.GET.400.title',
              defaultMessage: 'Searching Task Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchTask.GET.default.title',
              defaultMessage: 'Loading Task Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveTask(json)))
  }
}

export function fetchTasks(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = getFilters(filtersParams)
    dispatch(requestTasks(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/task?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        ...filters,
      })}`,
      {
        errorTasks: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchTasks.GET.400.title',
                defaultMessage: 'Searching Tasks Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchTasks.GET.default.title',
                defaultMessage: 'Loading Tasks Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveTasks(json)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Task = Immutable.Record({
  items: new Items(),
  table: new Table(),
  countByAlert: Immutable.Map(),
  sites: Immutable.List(),
  devices: Immutable.List(),
  title: String(),
  taskDetails: Immutable.Map(),
  jobPersons: Immutable.List(),
})

const initialState = new Task()

export default function taskReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_TASKS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_TASKS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
        mutState.set('countByAlert', Immutable.Map(action.countByAlert))
      })
    case types.RECEIVE_TASKSBYSTATUS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
        mutState.set('countByAlert', Immutable.Map(action.countByAlert))
        mutState.set('sites', Immutable.List(action.sites))
        mutState.set('devices', Immutable.List(action.devices))
        mutState.set('title', Immutable.fromJS(action.title))
      })
    case types.RECEIVE_TASK:
      return state.withMutations(mutState => {
        mutState.set('taskDetails', Immutable.fromJS(action))
        mutState.set('jobPersons', Immutable.List(action.jobPersons))
      })
    default:
      return state
  }
}
