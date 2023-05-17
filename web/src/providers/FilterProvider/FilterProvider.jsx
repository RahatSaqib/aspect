import React, { createContext, useContext, useMemo, useState } from 'react'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import subtractDays from 'date-fns/subDays'
import { useLocation } from 'react-router-dom'

const FilterContext = createContext()

const now = new Date()
const minDate = startOfDay(subtractDays(now, 30))
const maxDate = endOfDay(now)

// TODO: remove pagination from URL
const defaultFilter = {
  '/browse/device/list': {}, // done
  '/browse/device/workload': { minDate: startOfMonth(now), maxDate: endOfMonth(now), singleAssayId: -1 }, // done
  '/browse/deviceApiKey': {}, // done
  '/browse/inventory/supplies': { hasStock: true }, // done
  '/browse/inventory/log': { minDate, maxDate }, // done
  '/browse/notification': {}, // done
  '/browse/person': { contactStatus: 0 }, // done
  '/browse/reporter': { minDate, maxDate }, // done
  '/browse/result': {}, // done
  '/browse/site': {}, // done
  '/reports': {}, // done
}

function mapValues(value) {
  switch (true) {
    case ['true', 'false'].includes(value):
      return Boolean(value)
    case value.includes('+'):
      return value.replaceAll('+', ' ')
    default: {
      return value
    }
  }
}

function FilterProvider({ children }) {
  const { pathname, search } = useLocation()

  const initialFilter = useMemo(() => {
    const filters = { ...defaultFilter }
    try {
      const params = new URLSearchParams(search).get('filters').split('&')
      if (filters[pathname]) {
        params.forEach(item => {
          const [name, value] = item.split('=')
          if (!['minDate', 'maxDate', 'maxExpirationDate', 'minExpirationDate'].includes(name))
            filters[pathname] = { ...filters[pathname], [name]: mapValues(value) }
        })
        return filters
      }
      return defaultFilter
    } catch (e) {
      return defaultFilter
    }
  }, [pathname, search])

  const filterState = useState(initialFilter)

  return <FilterContext.Provider value={filterState}>{children}</FilterContext.Provider>
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
