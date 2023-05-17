import React, { createContext, useContext, useEffect, useState } from 'react'
import { useInitialValues } from './tools'

const FilterContext = createContext()

function FilterProvider({ children }) {
  const { initialFilter } = useInitialValues()

  const [filterState, setFilterState] = useState()

  useEffect(() => setFilterState(initialFilter), [setFilterState, initialFilter])

  return <FilterContext.Provider value={[filterState, setFilterState]}>{children}</FilterContext.Provider>
}

function useFilterValues(pathname) {
  const [filter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  // eslint-disable-next-line no-unused-vars
  return Object.fromEntries(Object.entries(filter[pathname]).filter(([_, v]) => v != null)) // remove nulls
}

function useFilterUpdate() {
  const [filter, setFilter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  const update = (newFilter, pathname) => setFilter({ ...filter, [pathname]: { ...newFilter } })

  const removeFilter = (keys, pathname) => {
    const filterForLocation = filter[pathname]
    keys.forEach(k => {
      if (k.includes('.')) {
        const [key, value] = k.split('.')
        filterForLocation[key] = filterForLocation[key].filter(v => v !== value)
      } else {
        delete filterForLocation[k]
      }
    })

    update(filterForLocation, pathname)
  }

  const resetFilter = pathname => setFilter({ ...filter, [pathname]: { ...defaultFilter[pathname] } })

  return [update, removeFilter, resetFilter] // pathname is to allow changing the filter in other places before navigation
}

export { FilterProvider, useFilterValues, useFilterUpdate }
