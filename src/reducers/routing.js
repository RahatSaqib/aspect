import Immutable from 'immutable'
import { LOCATION_CHANGE } from 'react-router-redux'

function locationChange(state, payload){
  return state.merge({ locationBeforeTransitions: payload })
}

const routing = function(state = Immutable.fromJS({
  locationBeforeTransitions: null
}), action) {
  switch (action.type) {
  case LOCATION_CHANGE:
    return locationChange(state, action.payload)
  }
  return state
}

export default routing
