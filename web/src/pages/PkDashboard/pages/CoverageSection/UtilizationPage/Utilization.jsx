import React, { useState, useMemo } from 'react'
import { Typography } from '@mui/material'
import subYears from 'date-fns/subYears'
import round from 'lodash/round'
import { useQuery } from 'react-query'
import { PeriodSelector } from '../../../../../cleanComponents'
import Loading from '../../../../../cleanComponents/Loading'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import UtilizationGraph from '../../../components/UtilizationGraph'
import messages from '../../../PkDashboard.Messages'

const UtilizationPage = () => {
  const { formatMessage } = useI18n()
  const [filter, setFilter] = useState({
    minDate: getTimePeriod(1, 'months', 'yyyy-MM-dd'),
    maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
  })

  const data = new Array(111).fill({}).map((i, idx) => createData(idx, `City ${idx}`, 159, 6, 24, 9, 5))

  const now = new Date()
  const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))

  const { isLoading: isLoadingNational, data: { data: rawNational = [], WORKING_DAYS_IN_YEAR } = {} } = useQuery(
    ['tblUtilizationPage_National'],
    async () =>
      fetchWrapperForQueries({
        endpoint: '/device/annual-utilization-rate-national',
        params: {
          minDate: subYears(startOfYearUTC, 5),
          maxDate: now,
        },
      })
  )
  const { isLoading: isLoadingProvincial, data: { data: rawProvincial = [] } = {} } = useQuery(
    ['tblUtilizationPage_Provincial'],
    async () =>
      fetchWrapperForQueries({
        endpoint: '/device/annual-utilization-rate-provincial',
        params: { minDate: startOfYearUTC, maxDate: now },
      })
  )

  const national = useMemo(() => {
    const allYearsSet = new Set()
    /**
     * go through all devices and count their tests per each year and
     * then calculate rates for each year
     */
    const byYearCounts = {}
    rawNational.forEach(device => {
      const { dailyCapacity, rates } = device
      rates.forEach(({ year, count }) => {
        allYearsSet.add(+year)
        byYearCounts[year] = byYearCounts[year] || { capacityCounts: 0, actualCounts: 0 }
        byYearCounts[year].actualCounts += count
        byYearCounts[year].capacityCounts += dailyCapacity * WORKING_DAYS_IN_YEAR
      })
    })
    const data = Object.keys(byYearCounts).reduce((acc, year) => {
      const { actualCounts, capacityCounts } = byYearCounts[year]
      const percent = (actualCounts * 100) / Math.max(capacityCounts, 1)
      const rate = round(percent, 2)
      acc = [...acc, { year, total: rate }]
      return acc
    }, [])

    return { data, keys: ['total'], indexBy: 'year' }
  }, [rawNational, WORKING_DAYS_IN_YEAR])

  const provincial = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const data = rawProvincial.map(province => {
      const { stateName, rates } = province
      const currentYearRate = rates.find(r => +r.year === currentYear)
      const rate = currentYearRate ? currentYearRate.rate : 0
      return { stateName, rate }
    })

    return { data, keys: ['rate'], indexBy: 'stateName' }
  }, [rawProvincial])

  const columns = [
    { name: 'Name', prop: 'name' },
    { name: 'Current Qty.', prop: 'quantity' },
    { name: 'Last 6 Months', prop: 'lastSixMonths' },
    { name: 'Used', prop: 'used' },
    { name: 'Consumption Rate', prop: 'rate' },
    { name: 'Days Left', prop: 'left' },
  ]

  return (
    <PkPage
      title={formatMessage(messages.utilizationTitle)}
      filter={
        <PeriodSelector
          label={formatMessage(messages.date)}
          minDate={filter.minDate || null}
          maxDate={filter.maxDate || null}
          onChange={dateValues => setFilter({ ...filter, ...dateValues })}
        />
      }
    >
      <NestedTable columns={columns} rows={data} hasDetail />
      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        {formatMessage(messages.nationalUtilizationTrendsAnnual)}
      </Typography>
      <div style={{ height: '400px' }}>
        {isLoadingNational ? (
          <Loading />
        ) : (
          <UtilizationGraph data={national.data} keys={national.keys} indexBy={national.indexBy} />
        )}
      </div>
      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        {formatMessage(messages.provincesUtilizationTrendsAnnual)}
      </Typography>
      <div style={{ height: '400px' }}>
        {isLoadingProvincial ? (
          <Loading />
        ) : (
          <UtilizationGraph data={provincial.data} keys={provincial.keys} indexBy={provincial.indexBy} />
        )}
      </div>
    </PkPage>
  )
}

export default UtilizationPage

function createData(id, name, quantity, lastSixMonths, used, rate, left) {
  return {
    id,
    name,
    quantity,
    lastSixMonths,
    used,
    rate,
    left,
    children: [
      { id: `${id}${id}`, name, quantity, lastSixMonths, used, rate, left },
      { id: `${id}${id}2`, name, quantity, lastSixMonths, used, rate, left },
    ],
  }
}
