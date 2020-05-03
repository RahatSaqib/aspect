import { defineMessages } from 'react-intl'
import Immutable from 'immutable'

import { aspectFetch } from '../../../../shared/utils/fetch'

import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../../../error/CommonErrorNotifications'

import {
  onRequested,
  removeEmptyParams,
  sanitiseParams,
} from '../../Helpers/Redux'

const initialState = Immutable.Map()
// const initialState = new Summary();

export const REQUEST_CLINICAL_INDICATORS_DASHBOARD =
  'REQUEST_CLINICAL_INDICATORS_DASHBOARD'
export const RECEIVE_CLINICAL_INDICATORS_DASHBOARD =
  'RECEIVE_CLINICAL_INDICATORS_DASHBOARD'

export function fetchClinicalIndicatorsDashboard(config) {
  let endpointParams = ''
  const { parentId, id, whiteListed, api } = removeEmptyParams(config)
  const { endpoint, params } = api
  const assayParams = whiteListed
    .map(a => `assay=${encodeURIComponent(a)}`)
    .join('&')

  for (const [key, value] of Object.entries(sanitiseParams(params))) {
    if (Array.isArray(value)) {
      endpointParams += value
        .map(v => `${key}=${encodeURIComponent(v)}`)
        .join('&')
    } else {
      endpointParams += `&${key}=${encodeURIComponent(value)}`
    }
  }

  return dispatch => {
    const requestedAt = `results_${Date.now()}`
    dispatch(requestClinicalIndicatorsDashboard({ requestedAt }))
    return aspectFetch(`/${endpoint}?${assayParams}&${endpointParams}`, {
      method: 'GET',
      errorNotifications: {
        403: errorInsufficientScope(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchClinicalIndicatorsDashboard.GET.403.title',
              defaultMessage: 'Insufficient Permissions',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchClinicalIndicatorsDashboard.GET.default.title',
              defaultMessage: 'Error Loading Dashboard Results By Category',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(
        receiveClinicalIndicatorsDashboard(parentId, id, requestedAt, json)
      )
    )
  }
}

function requestClinicalIndicatorsDashboard(payload) {
  return {
    type: REQUEST_CLINICAL_INDICATORS_DASHBOARD,
    ...payload,
  }
}

function receiveClinicalIndicatorsDashboard(parentId, id, requestedAt, data) {
  return {
    parentId,
    id,
    requestedAt,
    data,
    type: RECEIVE_CLINICAL_INDICATORS_DASHBOARD,
  }
}

export default function clinicalIndicators(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_CLINICAL_INDICATORS_DASHBOARD: {
      const { parentId, data, id } = action
      return state.withMutations(mutState => {
        const currentState = state.toJS()
        const currentAssayData = currentState[parentId]
        mutState.set(
          [parentId],
          new Immutable.fromJS({
            ...currentAssayData,
            [id]: { ...data },
          })
        )
      })
    }
    default:
      return state
  }
}
