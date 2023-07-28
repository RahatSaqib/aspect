import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { getFilters } from '../oldComponents/utils'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { receiveList, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_TASKS: 'REQUEST_TASKS',
  REQUEST_TASK: 'REQUEST_TASK',
  RECEIVE_TASKS: 'RECEIVE_TASKS',
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

function receiveTasks(json) {
  return {
    type: types.RECEIVE_TASKS,
    items: json.data,
    total: json.total,
    countByAlert: json.countByAlert,
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
    default:
      return state
  }
}
