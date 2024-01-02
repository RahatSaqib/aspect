import React, { useEffect, useState } from 'react'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import useAssayList from '../../hooks/assay/useAssayList'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'
import useAuthState from '../../hooks/useAuthState'
import FilterContext from './FilterProvider.Context'

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

const FilterProvider = ({ children }) => {
  const [filterState, setFilterState] = useState(defaultFilter)
  const { isLoggedOut, jwt } = useAuthState()
  const isUserReady = !isLoggedOut && !jwt.hasToAcceptLicenseId
  const { data: deviceTypes } = useDeviceTypeList({ enabled: isUserReady })
  const { data: assays } = useAssayList({ enabled: isUserReady })

  useEffect(() => {
    const filters = { ...filterState }

    // default filter (data based)
    if (assays?.length) {
      const mostResultsAssay = assays.filter(a => a.hasResults).sort((a, b) => b.resultCount - a.resultCount)[0]

      if (filters['/browse/device/workload'].singleAssayId === -1) {
        filters['/browse/device/workload'].singleAssayId = mostResultsAssay?.id
      }
    }
    setFilterState(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assays, deviceTypes])

  return <FilterContext.Provider value={[filterState, setFilterState]}>{children}</FilterContext.Provider>
}

export default FilterProvider
