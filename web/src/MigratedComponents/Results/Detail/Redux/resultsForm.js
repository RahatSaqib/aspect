import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import createActions from '../../Forms/createConfig.json'
import editActions from '../../Forms/editConfig.json'
import generateActions from '../../../Redux/generateActions'

const initialState = Immutable.Map()
const GET_RESULT_FORM = generateActions('GET', 'RESULT_FORM')

export function fetchResultsForm(resultId) {
  return dispatch => {
    const screenSchema = resultId === 'add' ? createActions : editActions
    dispatch(receiveResultsForm(screenSchema))
  }
}

function receiveResultsForm(formSchema) {
  return {
    type: GET_RESULT_FORM.SUCCESS,
    formSchema,
  }
}

export default function resultsForm(state = initialState, action) {
  const { type, formSchema, error } = action
  switch (type) {
    case GET_RESULT_FORM.SUCCESS:
      return new Immutable.fromJS({
        formSchema,
        loading: false,
      })
    default:
      return state
  }
}
