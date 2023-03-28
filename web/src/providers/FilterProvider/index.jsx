import React, { useState, createContext, useContext } from 'react'
import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import subtractDays from 'date-fns/subDays'
import { useAuthState } from '../AuthProvider'

const FilterContext = createContext()

const now = new Date()
const minDate = startOfDay(subtractDays(now, 30)).toJSON()
const maxDate = endOfDay(now).toJSON()

const defaultFilter = {
  '/browse/device/list': {},
  '/browse/device/workload': { minDate: startOfMonth(now), maxDate, singleAssayId: '?' },
  '/browse/deviceApiKey': {},
  '/browse/inventory/supplies': { hasStock: true },
  '/browse/inventory/log': { minDate, maxDate },
  '/browse/notification': {},
  '/browse/person': { contactStatus: 0 },
  '/browse/reporter': { minDate, maxDate },
  '/browse/result': {},
  '/browse/router': {},
  '/browse/site': {},
  '/reports': {},
}

function FilterProvider({ children }) {
  const { countryId } = useAuthState()

  Object.keys(defaultFilter).map(k => (defaultFilter[k] = { countryId, ...defaultFilter[k] }))

  const filterState = useState(defaultFilter)

  // console.log(filterState[0])

  return <FilterContext.Provider value={filterState}>{children}</FilterContext.Provider>
}

function useFilterValues(pathname) {
  const [filter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  return filter[pathname]
}

function useFilterUpdate() {
  const [filter, setFilter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  const update = (newFilter, pathname) => setFilter({ ...filter, [pathname]: { ...newFilter } })

  const removeFilter = (key, pathname) => {
    const filterForLocation = filter[pathname]
    const { [key]: removed, ...newFilter } = filterForLocation

    update(newFilter, pathname)
  }

  return [update, removeFilter] // pathname is to allow changinh the filter in other places before navigation
}

export { FilterProvider, useFilterValues, useFilterUpdate }
