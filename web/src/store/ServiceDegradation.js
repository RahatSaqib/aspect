const STORAGE_KEY = 'serviceDegradation'

const types = {
  SHOW_SERVICE_DEGRADATION: 'SHOW_SERVICE_DEGRADATION',
  HIDE_SERVICE_DEGRADATION: 'HIDE_SERVICE_DEGRADATION',
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
export function hideServiceDegradation() {
  return {
    type: types.HIDE_SERVICE_DEGRADATION,
  }
}

const getInitialState = () => {
  const savedState = localStorage.getItem(STORAGE_KEY)
  return savedState ? JSON.parse(savedState) : null
}

export default function serviceDegradationReducer(state = getInitialState(), action) {
  switch (action.type) {
    case types.SHOW_SERVICE_DEGRADATION:
      localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload))
      return action.payload

    case types.HIDE_SERVICE_DEGRADATION:
      localStorage.removeItem(STORAGE_KEY)
      return null
    default:
      return state
  }
}
