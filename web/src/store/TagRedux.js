import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

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
    }).then(json => dispatch(createReceiveUpdatedTags(qryId, qryType, json.data)))
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
      return state.setIn(['tags', action.qryType, action.qryId], Immutable.fromJS(action.items))
    case types.REQUEST_POSSIBLE_TAGS:
      return requestPossibleTags(state, action.qryType)
    case types.RECEIVE_POSSIBLE_TAGS:
      return state.mergeDeepIn(
        ['possibleTags', action.qryType],
        new LazyTagItems({
          loading: false,
          lastRefreshed: action.lastRefreshed,
          items: Immutable.fromJS(action.items),
        })
      )
    default:
      return state
  }
}
