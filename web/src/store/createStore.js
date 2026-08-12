import { useEffect, useState } from 'react'

// Minimal observable store so state can also be read and updated outside of React
export default function createStore(initialState) {
  let state = initialState
  const listeners = new Set()

  const getState = () => state

  const setState = updater => {
    const nextState = typeof updater === 'function' ? updater(state) : updater
    if (nextState === state) {
      return state
    }
    state = nextState
    listeners.forEach(listener => listener(state))
    return state
  }

  const subscribe = listener => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const useStore = () => {
    const [value, setValue] = useState(state)

    useEffect(() => {
      // the store may have changed between the first render and the subscription
      setValue(state)
      return subscribe(setValue)
    }, [])

    return value
  }

  return { getState, setState, subscribe, useStore }
}
