import React, { useState, useMemo } from 'react'
import { Typography } from '@mui/material'
import keys from 'lodash/keys'
import reduce from 'lodash/reduce'
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

  const mergedParams = []

  const { isLoading: isLoadingNational, data: { data: rawNational = [], WORKING_DAYS_IN_YEAR } = {} } = useQuery(
    ['tblUtilizationPage_National', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/device/annual-utilization-rate-national', params: mergedParams })
  )
  const { isLoading: isLoadingProvincial, data: { data: rawProvincial = [] } = {} } = useQuery(
    ['tblUtilizationPage_Provincial', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/device/annual-utilization-rate-provincial', params: mergedParams })
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
        allYearsSet.add(year)
        byYearCounts[year] = byYearCounts[year] || { capacityCounts: 0, actualCounts: 0 }
        byYearCounts[year].actualCounts += count
        byYearCounts[year].capacityCounts += dailyCapacity * WORKING_DAYS_IN_YEAR
      })
    })
    const data = [
      reduce(
        keys(byYearCounts),
        (acc, year) => {
          const { actualCounts, capacityCounts } = byYearCounts[year]
          const percent = (actualCounts * 100) / Math.max(capacityCounts, 1)
          const rate = round(percent, 2)
          acc = { ...acc, [+year]: rate }
          return acc
        },
        { total: 'Total' }
      ),
    ]
    return { data, keys: [...allYearsSet].sort(), indexBy: 'total' }
  }, [rawNational, WORKING_DAYS_IN_YEAR])

  const provincial = useMemo(() => {
    const allYearsSet = new Set()
    const data = reduce(
      rawProvincial,
      (acc, { stateName, rates }) => {
        const item = { stateName }
        rates.forEach(({ rate, year }) => {
          allYearsSet.add(year)
          item[+year] = rate
        })
        return [...acc, item]
      },
      []
    )
    return { data, keys: [...allYearsSet].sort(), indexBy: 'stateName' }
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
      <div style={{ height: '400px', marginTop: 32 }}>
        {isLoadingNational ? (
          <Loading />
        ) : (
          <UtilizationGraph data={national.data} keys={national.keys} indexBy={national.indexBy} />
        )}
      </div>
      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        {formatMessage(messages.provincesUtilizationTrendsAnnual)}
      </Typography>
      <div style={{ height: '800px', marginTop: 32 }}>
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
