import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { errorPleaseTryAgainInAFewMinutes, errorForbidden } from '../utils/error/CommonErrorNotifications'
import { receiveItem, Items } from '../utils/metaReducers/items'
import { Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'

const types = {
  REQUEST_SITES_FOR_SELECT_LIST: 'REQUEST_SITES_FOR_SELECT_LIST',
  RECEIVE_SITES_FOR_SELECT_LIST: 'RECEIVE_SITES_FOR_SELECT_LIST',
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
const SelectListItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  countryName: undefined,
  stateName: undefined,
  lastRefreshed: undefined,
})
const Site = Immutable.Record({
  items: new Items(),
  table: new Table(),
  selectList: new SelectListItems(),
})

const initialState = new Site()

export default function siteReducer(state = initialState, action) {
  switch (action.type) {
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
