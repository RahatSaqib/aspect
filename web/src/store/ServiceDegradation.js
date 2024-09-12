const types = {
  SHOW_SERVICE_DEGRADATION: 'SHOW_SERVICE_DEGRADATION',
}

export function showServiceDegradation({ message, variant }) {
  return {
    type: types.SHOW_SERVICE_DEGRADATION,
    payload: {
      message,
      variant,
    },
  }
}

export default function serviceDegradationReducer(state = null, action) {
  switch (action.type) {
    case types.SHOW_SERVICE_DEGRADATION:
      return action.payload
    default:
      return state
  }
}
