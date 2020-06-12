import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../../../../shared/utils/fetch'
import {
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
} from '../../../../error/CommonErrorNotifications'
import generateActions from '../../../Redux/generateActions'

const initialState = Immutable.Map()
const GET_RESULT = generateActions('GET', 'RESULT')

export function fetchResultsDetail(resultId) {
  return dispatch => {
    dispatch(requestSingleResult(resultId))
    return aspectFetch(`/result/${resultId}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchResultsDetail.GET.404.title',
              defaultMessage: 'Could Not Find Test Result',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchResultsDetailDetails.GET.default.title',
              defaultMessage: 'Error Loading Result Details',
            },
          })
        ),
      },
    })
      .then(json => dispatch(receiveSingleResult(json.data)))
      .catch(err => dispatch(failureSingleresult(err)))
  }
}

function requestSingleResult(resultId) {
  return {
    type: GET_RESULT.REQUEST,
    resultId,
  }
}

function receiveSingleResult(item) {
  return {
    type: GET_RESULT.SUCCESS,
    item,
  }
}

function failureSingleresult(error) {
  return {
    type: GET_RESULT.SUCCESS,
    error,
  }
}

export default function resultsDetail(state = initialState, action) {
  const { type, item, error } = action
  switch (type) {
    case GET_RESULT.REQUEST:
      return new Immutable.fromJS({ loading: true })
    case GET_RESULT.SUCCESS:
      return new Immutable.fromJS({
        formData: item || false,
        loading: false,
      })
    case GET_RESULT.FAILURE:
      return new Immutable.fromJS({ error, loading: false })
    default:
      return state
  }
}
