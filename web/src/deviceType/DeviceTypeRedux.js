import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import differenceInMinutes from 'date-fns/differenceInMinutes'

import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_DEVICE_TYPES_FOR_SELECT_LIST: 'REQUEST_DEVICE_TYPES_FOR_SELECT_LIST',
  RECEIVE_DEVICE_TYPES_FOR_SELECT_LIST: 'RECEIVE_DEVICE_TYPES_FOR_SELECT_LIST',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestDeviceTypesForSelectList() {
  return {
    type: types.REQUEST_DEVICE_TYPES_FOR_SELECT_LIST,
  }
}

function receiveDeviceTypesForSelectList(sitesForSelectList) {
  return {
    type: types.RECEIVE_DEVICE_TYPES_FOR_SELECT_LIST,
    items: sitesForSelectList,
    lastRefreshed: new Date(),
  }
}

export function fetchDeviceTypesForSelectList(forceRefresh) {
  return (dispatch, getState) => {
    const { site } = getState()

    if (site.getIn(['sitesForSelectList', 'loading'])) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !site.getIn(['sitesForSelectList', 'lastRefreshed']) ||
      differenceInMinutes(
        new Date(),
        site.getIn(['sitesForSelectList', 'lastRefreshed'])
      ) > 5 // five minutes
    if (!shouldFetch) {
      return
    }

    dispatch(requestDeviceTypesForSelectList())
    return aspectFetch('/device-type/select-list', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceTypes.GET.default.title',
              defaultMessage: 'Loading DeviceTypes Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveDeviceTypesForSelectList(json.data)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
export const SelectListItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})
export const DeviceType = Immutable.Record({
  selectList: new SelectListItems(),
})

const initialState = new DeviceType()

export default function deviceTypeReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICE_TYPES_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_DEVICE_TYPES_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: new Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
