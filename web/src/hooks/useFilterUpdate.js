import { useContext } from 'react'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import FilterContext from '../providers/FilterProvider/FilterProvider.Context'

const now = new Date()
const minDate = startOfDay(subtractDays(now, 30))
const maxDate = endOfDay(now)

// TODO: remove pagination from URL
export const defaultFilter = {
  '/browse/deviceApiKey': {},
  '/browse/device/list': {},
  '/browse/device/workload': { minDate: startOfMonth(now), maxDate: endOfMonth(now), singleAssayId: -1 },
  '/browse/inventory/log': { minDate, maxDate },
  '/browse/inventory/supplies': { hasStock: true },
  '/browse/inventory/transfers': {},
  '/browse/notification/types': {},
  '/browse/person': { contactStatus: 0 },
  '/browse/reporter': { minDate, maxDate },
  '/browse/result': { fixedMinDate: minDate, fixedMaxDate: maxDate },
  '/browse/site': {},
  '/dashboard/xdr/by-device': { minDate: startOfYear(now), maxDate },
  '/reports': {},
  '/dashboard/coverage/error-rate': { minDate: startOfMonth(now), maxDate: endOfMonth(now) },
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

export default useFilterUpdate
