import { useCallback, useMemo } from 'react'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import subtractDays from 'date-fns/subDays'
import isArray from 'lodash/isArray'
import { useLocation } from 'react-router-dom'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'

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

export function useInitialValues() {
  const { pathname, search } = useLocation()
  const { data: deviceTypes } = useDeviceTypeList()

  const mapValues = useCallback(
    (key, value) => {
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
    },
    [deviceTypes]
  )

  const getFilters = useCallback(
    urlSearchParams => {
      const filters = {}
      urlSearchParams.forEach((_value, key) => {
        const value = mapValues(key, _value)
        if (filters[key]) {
          let filter = filters[key]
          filter = isArray(filter) ? filter : [filter]
          filters[key] = [...filter, value]
        } else {
          filters[key] = value
        }
      })
      return filters
    },
    [mapValues]
  )

  const initialFilter = useMemo(() => {
    const filters = { ...defaultFilter }
    try {
      const searchParams = new URLSearchParams(search)
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      if (filters[pathname]) {
        filters[pathname] = { ...filters[pathname], ...getFilters(filtersParams) }
      }
      return filters
    } catch (e) {
      return defaultFilter
    }
  }, [getFilters, pathname, search])

  return { initialFilter }
}
