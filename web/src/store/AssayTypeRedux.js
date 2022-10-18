import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_ASSAY_TYPES: 'REQUEST_ASSAY_TYPES',
  RECEIVE_ASSAY_TYPES: 'RECEIVE_ASSAY_TYPES',
}

function createRequestAssayTypes() {
  return { type: types.REQUEST_ASSAY_TYPES }
}

function createReceiveAssayTypes(assayTypes) {
  return {
    type: types.RECEIVE_ASSAY_TYPES,
    items: assayTypes,
    lastRefreshed: new Date(),
  }
}

export function fetchAssayTypes(forceRefresh) {
  return (dispatch, getState) => {
    const { assayType } = getState()

    if (assayType.loading) {
      return
    }
    const shouldFetch =
      forceRefresh || !assayType.lastRefreshed || differenceInMinutes(new Date(), assayType.lastRefreshed) > 5 // five minutes
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestAssayTypes())
    const path = '/assay-type'
    return aspectFetch(path, {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchAssayTypes.GET.400.title',
              defaultMessage: 'Searching Assay Types Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchAssayTypes.GET.default.title',
              defaultMessage: 'Loading Assay Types Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveAssayTypes(json.data)))
  }
}

export const AssayTypeItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})
export const AssayType = Immutable.Record({
  assayTypes: new AssayTypeItems(),
})
const initialState = new AssayType()

export default function assayTypeReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ASSAY_TYPES:
      return state.setIn(['assayTypes', 'loading'], true)
    case types.RECEIVE_ASSAY_TYPES:
      return state.mergeIn(['assayTypes'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
