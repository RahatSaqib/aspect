import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_CONSUMABLES: 'REQUEST_CONSUMABLES',
  RECEIVE_CONSUMABLES: 'RECEIVE_CONSUMABLES'
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

    if (consumable.loading) {
      return
    }
    const shouldFetch = forceRefresh || !consumable.lastRefreshed || (
      differenceInMinutes(new Date(), consumable.lastRefreshed) > 5 // five minutes
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestConsumables())
    return aspectFetch('/inventory/consumable-types')
      .then(json => dispatch(createReceiveConsumables(json.data)))
      .catch(err => dispatch(addError('Loading consumables failed', err.message, err)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Consumable = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined
})

const initialState = new Consumable()

function requestConsumables(state) {
  return state.set('loading', true)
}

function receiveConsumables(state, consumables, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: new Immutable.fromJS(consumables)
  })
}

export default function consumableReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_CONSUMABLES:
      return requestConsumables(state)
    case types.RECEIVE_CONSUMABLES:
      return receiveConsumables(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
