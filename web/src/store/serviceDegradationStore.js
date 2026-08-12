import createStore from './createStore'

const STORAGE_KEY = 'serviceDegradation'

const getPersistedAlert = () => {
  const savedState = localStorage.getItem(STORAGE_KEY)
  return savedState ? JSON.parse(savedState) : null
}

const serviceDegradationStore = createStore(getPersistedAlert())

export const useServiceDegradation = serviceDegradationStore.useStore

export function showServiceDegradation({ message, variant }) {
  const alert = { message, variant }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alert))
  serviceDegradationStore.setState(alert)
}

export function hideServiceDegradation() {
  localStorage.removeItem(STORAGE_KEY)
  serviceDegradationStore.setState(null)
}
