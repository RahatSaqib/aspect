import _ from 'lodash'
import Immutable from 'immutable'
import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_PARTNERS_AND_ROLES_FOR_SELECT_LIST: 'REQUEST_PARTNERS_AND_ROLES_FOR_SELECT_LIST',
  RECEIVE_PARTNERS_AND_ROLES_FOR_SELECT_LIST: 'RECEIVE_PARTNERS_AND_ROLES_FOR_SELECT_LIST'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestPartnersAndRolesForSelectList() {
  return { type: types.REQUEST_PARTNERS_AND_ROLES_FOR_SELECT_LIST }
}

function createReceivePartnersAndRolesForSelectList(partners) {
  return {
    type:  types.RECEIVE_PARTNERS_AND_ROLES_FOR_SELECT_LIST,
    partners
  }
}

const cacheExpiryTime = 300000 //five minutes

export const fetchPartnersAndRolesForSelectList = function(partnersAndRolesForSelectList, forceRefresh) {
  return dispatch => {
    const now = new Date()
    if (forceRefresh || !partnersAndRolesForSelectList.get('lastRefreshed') ||
      Math.abs(now.getTime() - partnersAndRolesForSelectList.get('lastRefreshed').getTime()) > cacheExpiryTime) {
      dispatch(createRequestPartnersAndRolesForSelectList())
      return aspectFetch('/role/select-list')
        .then(json => dispatch(createReceivePartnersAndRolesForSelectList(json.data)))
        .catch(err => dispatch(addError('Loading partners and roles failed', err.message, err)))
    }
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Partner = Immutable.Record({
    id: null,
    name: null,
    orgUnits: Immutable.List()
  }), OrgUnit = Immutable.Record({
    id: null,
    name: null,
    roles: Immutable.List()
  }), Role = Immutable.Record({
    id: null,
    name: null
  }), LazyLoadPartnersAndRoles = Immutable.Record({
    loading: false,
    lastRefreshed: undefined,
    partners: Immutable.List()
  }), Roles = Immutable.Record({
    partnersAndRolesForSelectList: new LazyLoadPartnersAndRoles()
  })

const initialState = new Roles()

function requestPartnersAndRolesForSelectList(state) {
  return state.mergeDeep({
    partnersAndRolesForSelectList: {
      loading: true
    }
  })
}

function receivePartnersAndRolesForSelectList(state, partners) {
  return state.mergeDeep({
    partnersAndRolesForSelectList: {
      loading: false,
      lastRefreshed: new Date(),
      partners: new Immutable.List(_.map(partners, partner => new Partner({
        id: partner.id,
        name: partner.name,
        orgUnits: new Immutable.List(_.map(partner.orgUnits, orgUnit => new OrgUnit({
          id: orgUnit.id,
          name: orgUnit.name,
          roles: new Immutable.List(_.map(orgUnit.roles, role => new Role({
            id: role.id,
            name: role.name
          })))
        })))
      })))
    }
  })
}

export default function rolesReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_PARTNERS_AND_ROLES_FOR_SELECT_LIST:
    return requestPartnersAndRolesForSelectList(state)
  case types.RECEIVE_PARTNERS_AND_ROLES_FOR_SELECT_LIST:
    return receivePartnersAndRolesForSelectList(state, action.partners)
  }
  return state
}
