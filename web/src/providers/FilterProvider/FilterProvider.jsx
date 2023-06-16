import React, { createContext, useContext, useEffect, useState } from 'react'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import isArray from 'lodash/isArray'
import { useLocation } from 'react-router-dom'
import useAssayList from '../../hooks/assay/useAssayList'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'
import { useAuthState } from '../AuthProvider'

const now = new Date()
const minDate = startOfDay(subtractDays(now, 30))
const maxDate = endOfDay(now)

// TODO: remove pagination from URL
const defaultFilter = {
  '/browse/deviceApiKey': {},
  '/browse/device/list': {},
  '/browse/device/workload': { minDate: startOfMonth(now), maxDate: endOfMonth(now), singleAssayId: -1 },
  '/browse/inventory/log': { minDate, maxDate },
  '/browse/inventory/supplies': { hasStock: true },
  '/browse/inventory/transfers': {},
  '/browse/notification': {},
  '/browse/person': { contactStatus: 0 },
  '/browse/reporter': { minDate, maxDate },
  '/browse/result': {},
  '/browse/site': {},
  '/dashboard/xdr/by-device': { minDate: startOfYear(now), maxDate },
  '/reports': {},
}

const FilterContext = createContext()

const mapValues = (key, value, deviceTypes) => {
  switch (true) {
    case ['minDate', 'maxDate', 'maxExpirationDate', 'minExpirationDate'].includes(key):
      return new Date(value)
    case key === 'deviceMaintenanceStatusId':
      return [value]
    case key === 'deviceType':
      return deviceTypes?.find(i => i.externalId === value)?.id
    default: {
      return value
    }
  }
}
const getFilters = (urlSearchParams, deviceTypes) => {
  const filters = {}
  urlSearchParams.forEach((_value, key) => {
    const value = mapValues(key, _value, deviceTypes)
    if (filters[key]) {
      let filter = filters[key]
      filter = isArray(filter) ? filter : [filter]
      filters[key] = [...filter, value]
    } else {
      filters[key] = value
    }
  })
  return filters
}

function FilterProvider({ children }) {
  const { pathname, search } = useLocation()
  const [filterState, setFilterState] = useState(defaultFilter)
  const user = useAuthState()
  const { data: deviceTypes } = useDeviceTypeList({ enabled: !user.isLoggedOut })
  const { data: assays } = useAssayList({ enabled: !user.isLoggedOut })

  useEffect(() => {
    const filters = { ...filterState }
    const searchParams = new URLSearchParams(search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    // default filter (data based)
    if (assays?.length) {
      const mostResultsAssay = assays.filter(a => a.hasResults).sort((a, b) => b.resultCount - a.resultCount)[0]

      if (filters['/browse/device/workload'].singleAssayId === -1) {
        filters['/browse/device/workload'].singleAssayId = mostResultsAssay?.id
      }
    } // url parsing
    if (filters[pathname] && filtersParams !== '') {
      searchParams.delete('filters')
      filters[pathname] = { ...filters[pathname], ...getFilters(filtersParams, deviceTypes) }
    }
    setFilterState(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assays, deviceTypes])

  return <FilterContext.Provider value={[filterState, setFilterState]}>{children}</FilterContext.Provider>
}

function useFilterValues(pathname) {
  const [filter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  if (pathname) {
    const cleanPath = pathname.split('#')[0]

    if (Object.keys(filter).includes(cleanPath)) {
      // eslint-disable-next-line no-unused-vars
      return Object.fromEntries(Object.entries(filter[cleanPath]).filter(([_, v]) => v != null)) // remove nulls
    }
  }
  return {}
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
