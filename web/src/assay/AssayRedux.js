import Immutable from 'immutable'
import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_ASSAYS: 'REQUEST_ASSAYS',
  RECEIVE_ASSAYS: 'RECEIVE_ASSAYS'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestAssays() {
  return { type: types.REQUEST_ASSAYS }
}

function createReceiveAssays(assays) {
  return {
    type:  types.RECEIVE_ASSAYS,
    items: assays,
    lastRefreshed: new Date()
  }
}

const fiveMinutes = 300000 //five minutes

export const fetchAssays = function(forceRefresh, assaysState) {
  return dispatch => {
    const now = new Date()
    if(!assaysState.get('loading') && (forceRefresh || !assaysState.get('lastRefreshed') ||
      Math.abs(now.getTime() - assaysState.get('lastRefreshed').getTime()) > fiveMinutes)) {
      dispatch(createRequestAssays())
      let path = '/assay'
      return aspectFetch(path)
        .then(json => dispatch(createReceiveAssays(json.data)))
        .catch(err => dispatch(addError('Loading assays failed', err.message, err)))
    }
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Assay = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined
})

const initialState = new Assay()

function requestAssays(state) {
  return state.set('loading', true)
}

function receiveAssays(state, assays, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed: lastRefreshed,
    items: new Immutable.fromJS(assays)
  })
}

export default function assayReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_ASSAYS:
    return requestAssays(state)
  case types.RECEIVE_ASSAYS:
    return receiveAssays(state, action.items, action.lastRefreshed)
  }
  return state
}
