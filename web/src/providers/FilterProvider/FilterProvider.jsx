import React, { useEffect, useState } from 'react'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import { useLocation } from 'react-router'
import useAssayList from '../../hooks/assay/useAssayList'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'
import useAuthState from '../../hooks/useAuthState'
import { getTimePeriod } from '../../components/shared/DateTimeInput/utils/date'
import FilterContext from './FilterProvider.Context'

const now = new Date()
const minDate = startOfDay(subtractDays(now, 30))
const maxDate = endOfDay(now)

const dashboardV2DefaultFilters = {
  '/dashboard/coverage/error-rate': {
    minDate,
    maxDate,
  },
  '/dashboard/rif/provincial-diagnosis-trend': { states: [], lgas: [] },
  '/dashboard/rif/provincial-rrtb-trend-comparison': { states: [], lgas: [] },
  '/dashboard/rif/provincial-testing-trend': { states: [], lgas: [] },
  '/dashboard/xdr/provincial-diagnosis-trend': { states: [], lgas: [] },
  '/dashboard/xdr/provincial-testing-trend': { states: [], lgas: [] },
  '/dashboard/xdr/provincial-fq-diagnosis-trend': { states: [], lgas: [] },
  '/dashboard/inventory/overview': {
    minDate: getTimePeriod(1, 'months', 'yyyy-MM-dd'),
    maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
  },
  '/dashboard/rif/current-testing': {},
  '/dashboard/rif/national-diagnosis': {},
  '/dashboard/rif/national-rtb': {},
  '/dashboard/rif/national-testing-trend': {},
  '/dashboard/rif/current-diagnosis': {},
  '/dashboard/rif/current-rrtb-diagnosis': {},
  '/dashboard/rif/test-diag-trend': {},
  '/dashboard/rif/rrtb-test-diagnosis': {},
  '/dashboard/xdr/national-testing-trend': {},
  '/dashboard/xdr/national-diagnosis': {},
  '/dashboard/xdr/national-fq': {},
  '/dashboard/xdr/current-testing': {},
  '/dashboard/xdr/current-diagnosis': {},
  '/dashboard/xdr/gx-testing-and-diagnosis': {},
  '/dashboard/xdr/data-visualisation-for-xdr-resistance': {},
  '/dashboard/xdr/testing-diagnosis-trend': {},
  '/dashboard/xdr/current-fq-detection': {},
  '/dashboard/coverage/device': {},
  '/dashboard/coverage/utilization': {},
  '/dashboard/other/covid': {},
  '/dashboard/other/hiv': {},
}

// TODO: remove pagination from URL
export const defaultFilter = {
  '/browse/deviceApiKey': {},
  '/browse/device/list': { connectorStatus: 'all', deviceApprovalExternalId: ['pendingDeployment', 'approved'] },
  '/browse/device/workload': { minDate: startOfMonth(now), maxDate: endOfMonth(now) }, //
  '/browse/inventory/log': { minDate, maxDate }, //
  '/browse/inventory/supplies': { hasStock: true }, //
  '/browse/inventory/transfers': {}, //
  '/browse/inventory/reconciliation': {},
  '/browse/notification/types': {},
  '/browse/person': { contactStatus: 0 },
  '/browse/reporter': { minDate, maxDate }, //
  '/browse/result': { minDate, maxDate }, //
  '/browse/forms/truenat-custom-fields': { minDate, maxDate },
  '/browse/samples': { minDate, maxDate }, //
  '/browse/site': {},
  '/dashboard/xdr/by-device': { minDate: startOfYear(now), maxDate }, //
  '/reports': { minDate, maxDate }, //
  '/dashboard/coverage/error-rate': { minDate: startOfMonth(now), maxDate: endOfMonth(now) },
  ...dashboardV2DefaultFilters,
}

const FilterProvider = ({ children }) => {
  const [filterState, setFilterState] = useState(defaultFilter)
  const { isLoggedOut, jwt } = useAuthState()
  const isUserReady = !isLoggedOut && !jwt.hasToAcceptLicenseId
  const { data: deviceTypes } = useDeviceTypeList({ enabled: isUserReady })
  const { data: assays } = useAssayList({ enabled: isUserReady })
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === '/dashboard-v2') {
      setFilterState(prev => ({ ...prev, ...dashboardV2DefaultFilters }))
    }
  }, [pathname])

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
