import { defineMessages } from 'react-intl'
import _ from 'lodash'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST: 'REQUEST_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST',
  RECEIVE_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST: 'RECEIVE_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestPartnersAndJobFunctionsForSelectList() {
  return { type: types.REQUEST_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST }
}

function createReceivePartnersAndJobFunctionsForSelectList(partners) {
  return {
    type: types.RECEIVE_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST,
    partners
  }
}

export function fetchPartnersAndJobFunctionsForSelectList(forceRefresh) {
  return (dispatch, getState) => {
    const { partnersAndJobFunctionsForSelectList } = getState().jobFunctions

    if (partnersAndJobFunctionsForSelectList.loading) {
      return
    }
    const { lastRefreshed } = partnersAndJobFunctionsForSelectList
    const shouldFetch = forceRefresh || !lastRefreshed || (
      differenceInMinutes(new Date(), lastRefreshed) > 5 // five minutes
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestPartnersAndJobFunctionsForSelectList())
    return aspectFetch('/job-function/select-list', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.fetchPartnersAndJobFunctionsForSelectList.GET.default.title',
            defaultMessage: 'Error Loading Partners And Job Functions'
          }
        }))
      }
    }).then(json =>
      dispatch(createReceivePartnersAndJobFunctionsForSelectList(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Partner = Immutable.Record({
  id: null,
  name: null,
  jobFunctions: Immutable.List()
})
const JobFunction = Immutable.Record({
  id: null,
  name: null
})
const LazyLoadPartnersAndJobFunctions = Immutable.Record({
  loading: false,
  lastRefreshed: undefined,
  partners: Immutable.List()
})
const Jobs = Immutable.Record({
  partnersAndJobFunctionsForSelectList: new LazyLoadPartnersAndJobFunctions()
})

const initialState = new Jobs()

function requestPartnersAndJobFunctionsForSelectList(state) {
  return state.mergeDeep({
    partnersAndJobFunctionsForSelectList: {
      loading: true
    }
  })
}

function receivePartnersAndJobFunctionsForSelectList(state, partners) {
  return state.mergeDeep({
    partnersAndJobFunctionsForSelectList: {
      loading: false,
      lastRefreshed: new Date(),
      partners: new Immutable.List(_.map(partners, partner => new Partner({
        id: partner.id,
        name: partner.name,
        jobFunctions: new Immutable.List(
          _.map(partner.jobFunctions, jobFunction => new JobFunction({
            id: jobFunction.id,
            name: jobFunction.name
          })))
      })))
    }
  })
}

export default function jobsReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST:
      return requestPartnersAndJobFunctionsForSelectList(state)
    case types.RECEIVE_PARTNERS_AND_JOB_FUNCTIONS_FOR_SELECT_LIST:
      return receivePartnersAndJobFunctionsForSelectList(state, action.partners)
    default:
      return state
  }
}
