import { defineMessages } from 'react-intl'
import _ from 'lodash'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

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
    type: types.RECEIVE_PARTNERS_AND_ROLES_FOR_SELECT_LIST,
    partners
  }
}

export function fetchPartnersAndRolesForSelectList(forceRefresh) {
  return (dispatch, getState) => {
    const { partnersAndRolesForSelectList } = getState().roles

    if (partnersAndRolesForSelectList.loading) {
      return
    }
    const { lastRefreshed } = partnersAndRolesForSelectList
    const shouldFetch = forceRefresh || !lastRefreshed || (
      differenceInMinutes(new Date(), lastRefreshed) > 5 // five minutes
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestPartnersAndRolesForSelectList())
    return aspectFetch('/role/select-list', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.fetchPartnersAndRolesForSelectList.GET.default.title',
            defaultMessage: 'Error Loading Partners And Roles'
          }
        }))
      }
    }).then(json =>
      dispatch(createReceivePartnersAndRolesForSelectList(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Partner = Immutable.Record({
  id: null,
  name: null,
  roles: Immutable.List()
})
const Role = Immutable.Record({
  id: null,
  name: null
})
const LazyLoadPartnersAndRoles = Immutable.Record({
  loading: false,
  lastRefreshed: undefined,
  partners: Immutable.List()
})
const Roles = Immutable.Record({
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
        roles: new Immutable.List(_.map(partner.roles, role => new Role({
          id: role.id,
          name: role.name
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
    default:
      return state
  }
}
