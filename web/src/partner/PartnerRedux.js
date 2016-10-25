import _ from 'lodash'
import Immutable from 'immutable'
import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_PARTNERS_FOR_SELECT_LIST: 'REQUEST_PARTNERS_FOR_SELECT_LIST',
  RECEIVE_PARTNERS_FOR_SELECT_LIST: 'RECEIVE_PARTNERS_FOR_SELECT_LIST'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestPartnersForSelectList() {
  return { type: types.REQUEST_PARTNERS_FOR_SELECT_LIST }
}

function createReceivePartnersForSelectList(partners) {
  return {
    type:  types.RECEIVE_PARTNERS_FOR_SELECT_LIST,
    partners: partners
  }
}

export const fetchPartnersForSelectList = function() {
  return dispatch => {
    dispatch(createRequestPartnersForSelectList())
    let path = '/partner/select-list'
    return aspectFetch(path)
      .then(json => dispatch(createReceivePartnersForSelectList(json.data)))
      .catch(err => dispatch(addError('Loading partners failed', err.message, err)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const LazyLoadItems = Immutable.Record({
    loading: false,
    items: Immutable.List()
  }), LazyLoadItem = Immutable.Record({
    id: undefined,
    name: undefined
  })

const Partner = Immutable.Record({
  partnersForSelectList: new LazyLoadItems({
    loading: false,
    items: Immutable.List([])
  })
})

const initialState = new Partner()

function requestPartnersForSelectList(state) {
  return state.setIn(['partnersForSelectList', 'loading'], true)
}

function receivePartnersForSelectList(state, partners) {
  return state.setIn(['partnersForSelectList'], new LazyLoadItems({
    loading: false,
    items: new Immutable.List(_.map(partners, partner => new LazyLoadItem({
      id: partner.id,
      name: partner.name
    })))
  }))
}

export default function partnerReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_PARTNERS_FOR_SELECT_LIST:
    return requestPartnersForSelectList(state)
  case types.RECEIVE_PARTNERS_FOR_SELECT_LIST:
    return receivePartnersForSelectList(state, action.partners)
  }
  return state
}
