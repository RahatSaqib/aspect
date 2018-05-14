import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import { defineMessages } from 'react-intl'
import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_TAGS: 'REQUEST_TAGS',
  RECEIVE_TAGS: 'RECEIVE_TAGS',
  REQUEST_POSSIBLE_TAGS: 'REQUEST_POSSIBLE_TAGS',
  RECEIVE_POSSIBLE_TAGS: 'RECEIVE_POSSIBLE_TAGS',
  REQUEST_UPDATING_TAGS: 'REQUEST_UPDATING_TAGS',
  RECEIVE_UPDATED_TAGS: 'RECEIVE_UPDATED_TAGS',
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestTags(qryId, qryType) {
  return {
    type: types.REQUEST_TAGS,
    qryId,
    qryType,
  }
}

function createReceiveTags(qryId, qryType, items) {
  return {
    type: types.RECEIVE_TAGS,
    qryId,
    qryType,
    items,
  }
}

export function fetchTags(qryId, qryType) {
  return dispatch => {
    dispatch(createRequestTags(qryId, qryType))
    return aspectFetch(`/tag/${qryType}/${qryId}`, {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchTags.GET.default.title',
              defaultMessage: 'Loading Tags Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveTags(qryId, qryType, json.data)))
  }
}

function createRequestPossibleTags(qryType) {
  return {
    type: types.REQUEST_POSSIBLE_TAGS,
    qryType,
  }
}

function createReceivePossibleTags(qryType, items) {
  return {
    type: types.RECEIVE_POSSIBLE_TAGS,
    qryType,
    items,
    lastRefreshed: new Date(),
  }
}

export function fetchPossibleTags(qryType, forceRefresh = false) {
  return (dispatch, getState) => {
    const { tag } = getState()
    const tagItems = tag.getIn(['possibleTags', qryType])

    if (tagItems && tagItems.loading) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !tagItems ||
      !tagItems.get('lastRefreshed') ||
      differenceInMinutes(new Date(), tagItems.get('lastRefreshed')) > 5 // five minutes

    if (!shouldFetch) {
      return
    }

    dispatch(createRequestPossibleTags(qryType))
    return aspectFetch(`/tag/${qryType}`, {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPossibleTags.GET.default.title',
              defaultMessage: 'Loading Possible Tags Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceivePossibleTags(qryType, json.data)))
  }
}

function createRequestUpdatingTag(qryId, qryType) {
  return {
    type: types.REQUEST_UPDATING_TAGS,
    qryId,
    qryType,
  }
}

function createReceiveUpdatedTags(qryId, qryType, items) {
  return {
    type: types.RECEIVE_UPDATED_TAGS,
    qryId,
    qryType,
    items,
  }
}

export function updateTags(qryId, qryType, tags) {
  return dispatch => {
    dispatch(createRequestUpdatingTag(qryId, qryType))

    return aspectFetch(`/tag/${qryType}/${qryId}`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateTags.PUT.default.title',
              defaultMessage: 'An Error Occurred When Trying to Update Tags',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(createReceiveUpdatedTags(qryId, qryType, json.data))
    )
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const LazyTagItems = Immutable.Record({
  loading: false,
  items: Immutable.List(),
  lastRefreshed: undefined,
})

const Tag = Immutable.Record({
  tags: Immutable.Map(),
  possibleTags: Immutable.Map(),
})

const initialState = new Tag()

function requestPossibleTags(state, qryType) {
  const tagItems = state.getIn(['possibleTags', qryType])
  if (tagItems) {
    state.setIn(['possibleTags', qryType, 'loading'], true)
  }
  return state
}

export default function tagReducer(state = initialState, action) {
  switch (action.type) {
    case types.RECEIVE_TAGS:
    case types.RECEIVE_UPDATED_TAGS:
      return state.setIn(
        ['tags', action.qryType, action.qryId],
        new Immutable.fromJS(action.items)
      )
    case types.REQUEST_POSSIBLE_TAGS:
      return requestPossibleTags(state, action.qryType)
    case types.RECEIVE_POSSIBLE_TAGS:
      return state.mergeDeepIn(
        ['possibleTags', action.qryType],
        new LazyTagItems({
          loading: false,
          lastRefreshed: action.lastRefreshed,
          items: new Immutable.fromJS(action.items),
        })
      )
    default:
      return state
  }
}
