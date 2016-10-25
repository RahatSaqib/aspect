import _ from 'lodash'
import Immutable from 'immutable'
import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_ORGANISATIONAL_UNITS_FOR_SELECT_LIST: 'REQUEST_ORGANISATIONAL_UNITS_FOR_SELECT_LIST',
  RECEIVE_ORGANISATIONAL_UNITS_FOR_SELECT_LIST: 'RECEIVE_PARTNERS_FOR_SELECT_LIST'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestOrganisationalUnitsForSelectList(partnerId) {
  return { type: types.REQUEST_ORGANISATIONAL_UNITS_FOR_SELECT_LIST, partnerId }
}

function createReceiveOrganisationalUnitsForSelectList(organisationalUnits) {
  return {
    type:  types.RECEIVE_ORGANISATIONAL_UNITS_FOR_SELECT_LIST,
    organisationalUnits
  }
}

export const fetchOrganisationalUnitsForSelectList = function(partnerId) {
  if(partnerId) {
    return dispatch => {
      dispatch(createRequestOrganisationalUnitsForSelectList())
      let path = `/organisational-unit/select-list/${partnerId}`
      return aspectFetch(path)
        .then(json => dispatch(createReceiveOrganisationalUnitsForSelectList(json.data)))
        .catch(err => dispatch(addError('Loading organisational units failed', err.message, err)))
    }
  }
}

/*
 * ---------------- Reducers -----------------
 */
const LazyLoadItems = Immutable.Record({
    loading: false,
    partnerId: 0,
    items: Immutable.List()
  }), LazyLoadItem = Immutable.Record({
    id: undefined,
    name: undefined
  })

const OrganisationalUnit = Immutable.Record({
  organisationalUnitsForSelectList: new LazyLoadItems({
    loading: false,
    items: Immutable.List([])
  })
})

const initialState = new OrganisationalUnit()

function requestOrganisationalUnitsForSelectList(state, partnerId) {
  return state.mergeDeep({
    organisationalUnitsForSelectList: {
      loading: true,
      partnerId: partnerId
    }
  })
}

function receiveOrganisationalUnitsForSelectList(state, organisationalUnits) {
  return state.mergeDeep({
    organisationalUnitsForSelectList: {
      loading: false,
      items: new Immutable.List(_.map(organisationalUnits, organisationalUnit => new LazyLoadItem({
        id: organisationalUnit.id,
        name: organisationalUnit.name
      })))
    }
  })
}

export default function organisationalUnitReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_ORGANISATIONAL_UNITS_FOR_SELECT_LIST:
    return requestOrganisationalUnitsForSelectList(state, action.partnerId)
  case types.RECEIVE_ORGANISATIONAL_UNITS_FOR_SELECT_LIST:
    return receiveOrganisationalUnitsForSelectList(state, action.organisationalUnits)
  }
  return state
}
