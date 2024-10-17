import { useEffect, useState } from 'react'
import { hierarchicalToggleSettingsLocalStorageKey } from './constants'

/**
 * Custom hook for managing hierarchical view state and store the user selection between page refreshes.
 *
 * @param {Object} props - The props object.
 * @param {string} props.localStorageKey - The key for storing the hierarchical view state in local storage.
 * @returns {Array} - An array containing the hierarchical view state and a function to update it.
 */
export function useHierarchicalSwitch(props) {
  const { localStorageKey } = props
  const hierarchicalViewSetting = JSON.parse(localStorage.getItem(localStorageKey) ?? '{}')
  const [isHierarchicalView, setIsHierarchicalView] = useState(hierarchicalViewSetting?.isHierarchicalView === true)
  const [isWarehouseView, setIsWarehouseView] = useState(hierarchicalViewSetting?.isWarehouseView === true)
  const [selectedSiteIds, setSelectedSiteIds] = useState([])

  useEffect(() => {
    if (Object.values(hierarchicalToggleSettingsLocalStorageKey).includes(localStorageKey)) {
      localStorage.setItem(localStorageKey, JSON.stringify({ isHierarchicalView, isWarehouseView }))
    }
  }, [isHierarchicalView, isWarehouseView, localStorageKey])

  return {
    isHierarchicalView,
    setIsHierarchicalView,
    isWarehouseView,
    setIsWarehouseView,
    selectedSiteIds,
    setSelectedSiteIds,
  }
}
