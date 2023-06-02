import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { errorPleaseTryAgainInAFewMinutes, errorForbidden } from '../utils/error/CommonErrorNotifications'
import { receiveItem, Items, receiveListWithSet } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_SITES: 'REQUEST_SITES',
  RECEIVE_SITES: 'RECEIVE_SITES',
  REJECTED_SITES: 'REJECTED_SITES',

  REQUEST_SINGLE_SITE: 'REQUEST_SINGLE_SITE',
  RECEIVE_SINGLE_SITE: 'RECEIVE_SINGLE_SITE',

  REQUEST_UPDATING_SINGLE_SITE: 'REQUEST_UPDATING_SINGLE_SITE',
  RECEIVE_UPDATED_SINGLE_SITE: 'RECEIVE_UPDATED_SINGLE_SITE',

  REQUEST_SITES_FOR_SELECT_LIST: 'REQUEST_SITES_FOR_SELECT_LIST',
  RECEIVE_SITES_FOR_SELECT_LIST: 'RECEIVE_SITES_FOR_SELECT_LIST',

  REQUEST_DELETING_SINGLE_SITE: 'REQUEST_DELETING_SINGLE_SITE',
  RECEIVE_DELETED_SINGLE_SITE: 'RECEIVE_DELETED_SINGLE_SITE',
}
/*
 * ---------------- Action Creators -----------------
 */

function requestSitesForSelectList() {
  return {
    type: types.REQUEST_SITES_FOR_SELECT_LIST,
  }
}

function receiveSitesForSelectList(json) {
  return {
    type: types.RECEIVE_SITES_FOR_SELECT_LIST,
    items: json.data,
    countryName: json.countryName,
    stateName: json.stateName,
    lastRefreshed: new Date(),
  }
}

export function fetchSitesForSelectList(forceRefresh) {
  return (dispatch, getState) => {
    const { site } = getState()

    if (site.getIn(['sitesForSelectList', 'loading'])) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !site.getIn(['sitesForSelectList', 'lastRefreshed']) ||
      differenceInMinutes(new Date(), site.getIn(['sitesForSelectList', 'lastRefreshed'])) > 5 // five minutes
    if (!shouldFetch) {
      return
    }
    dispatch(requestSitesForSelectList())
    return aspectFetch('/site/select-list', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSites.GET.default.title',
              defaultMessage: 'Loading Sites Failed',
            },
          })
        ),
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPersons.GET.403.title',
              defaultMessage: 'Insufficient Permissions',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSitesForSelectList(json)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const SelectListItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  countryName: undefined,
  stateName: undefined,
  lastRefreshed: undefined,
})
export const Site = Immutable.Record({
  items: new Items(),
  table: new Table(),
  selectList: new SelectListItems(),
})

const initialState = new Site()

export default function siteReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_SITES:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_SITES:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)

        mutState.set('items', receiveListWithSet(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REJECTED_SITES:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.RECEIVE_SINGLE_SITE:
    case types.RECEIVE_UPDATED_SINGLE_SITE:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', mutState.items.setIn(['byId', immutItem.get('id')], immutItem))
      })
    case types.RECEIVE_ASSIGN_PERSON:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.itemd)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.REQUEST_SITES_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_SITES_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
        countryName: action.countryName,
        stateName: action.stateName,
      })
    default:
      return state
  }
}
