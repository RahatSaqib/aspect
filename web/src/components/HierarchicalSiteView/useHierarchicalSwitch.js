import { useEffect, useState } from 'react'
import { hierarchicalToggleSettingsLocalStorageKey } from './constants'

export function useHierarchicalSwitch(props) {
  const { localStorageKey } = props
  const [isHierarchicalView, setIsHierarchicalView] = useState(localStorage.getItem(localStorageKey) === 'true')

  useEffect(() => {
    if (Object.values(hierarchicalToggleSettingsLocalStorageKey).includes(localStorageKey)) {
      localStorage.setItem(localStorageKey, isHierarchicalView.toString())
    }
  }, [isHierarchicalView, localStorageKey])

  return [isHierarchicalView, setIsHierarchicalView]
}
