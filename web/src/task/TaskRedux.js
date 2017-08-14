import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'
import { receiveList, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_TASKS: 'REQUEST_TASKS',
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
    const filters = _.fromPairs([...filtersParams.entries()])
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
