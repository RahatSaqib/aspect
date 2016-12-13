import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_CONSUMABLES: 'REQUEST_CONSUMABLES',
  RECEIVE_CONSUMABLES: 'RECEIVE_CONSUMABLES',

  REQUEST_CONSUMABLE_REASONS: 'REQUEST_CONSUMABLE_REASONS',
  RECEIVE_CONSUMABLE_REASONS: 'RECEIVE_CONSUMABLE_REASONS'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestConsumables() {
  return { type: types.REQUEST_CONSUMABLES }
}

function createReceiveConsumables(consumables) {
  return {
    type: types.RECEIVE_CONSUMABLES,
    items: consumables,
    lastRefreshed: new Date()
  }
}

export function fetchConsumables(forceRefresh) {
  return (dispatch, getState) => {
    const { consumable } = getState()

    if (consumable.getIn(['consumables', 'loading'])) {
      return
    }
    const shouldFetch = forceRefresh || !consumable.getIn(['consumables', 'lastRefreshed']) || (
      differenceInMinutes(new Date(), consumable.getIn(['consumables', 'lastRefreshed'])) > 5 // five minutes
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestConsumables())
    return aspectFetch('/inventory/consumable-types',
      {
        errorNotifications: {
          400: filterFieldsRejectedError(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchConsumables.GET.400.title',
              defaultMessage: 'Searching Consumables Failed'
            }
          })),
          default: errorPleaseTryAgainInAFewMinutes(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchConsumables.GET.default.title',
              defaultMessage: 'Loading Consumables Failed'
            }
          }))
        }
      })
      .then(json => dispatch(createReceiveConsumables(json.data)))
  }
}

function createRequestConsumableReasons() {
  return { type: types.REQUEST_CONSUMABLE_REASONS }
}

function createReceiveConsumableReasons(consumableReasons) {
  return {
    type: types.RECEIVE_CONSUMABLE_REASONS,
    items: consumableReasons,
    lastRefreshed: new Date()
  }
}

export function fetchConsumableReasons(forceRefresh) {
  return (dispatch, getState) => {
    const { consumable } = getState()

    if (consumable.getIn(['consumableReasons', 'loading'])) {
      return
    }
    const shouldFetch = forceRefresh || !consumable.getIn(['consumableReasons', 'lastRefreshed']) || (
        differenceInMinutes(new Date(), consumable.getIn(['consumableReasons', 'lastRefreshed'])) > 5 // five minutes
      )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestConsumableReasons())
    return aspectFetch('/inventory/consumable-reason')
      .then(json => dispatch(createReceiveConsumableReasons(json.data)))
      .catch(err => dispatch(addError('Loading consumable reasons failed', err.message, err)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const ConsumableItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined
})
const Consumable = Immutable.Record({
  consumables: new ConsumableItems(),
  consumableReasons: new ConsumableItems()
})
const initialState = new Consumable()

export default function consumableReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_CONSUMABLES:
      return state.setIn(['consumables', 'loading'], true)
    case types.RECEIVE_CONSUMABLES:
      return state.mergeIn(['consumables'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: new Immutable.fromJS(action.items)
      })
    case types.REQUEST_CONSUMABLE_REASONS:
      return state.setIn(['consumableReasons', 'loading'], true)
    case types.RECEIVE_CONSUMABLE_REASONS:
      return state.mergeIn(['consumableReasons'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: new Immutable.fromJS(action.items)
      })
    default:
      return state
  }
}
