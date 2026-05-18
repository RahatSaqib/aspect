import React, { useMemo, useState } from 'react'
import { Alert } from '@mui/lab'
import { colors, Grid, Typography } from '@mui/material'
import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import subtractDays from 'date-fns/subDays'
import subYears from 'date-fns/subYears'
import orderBy from 'lodash/orderBy'
import round from 'lodash/round'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { BarGraph, Loading, PeriodSelector } from '../../../../../components'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import { useUtilizationTable } from '../../../hooks/useUtilizationTable'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))

const nationalFilters = {
  minDate: subYears(startOfYearUTC, 5),
  maxDate: now,
}

const UtilizationPage = () => {
  const { formatMessage } = useIntl()
  const [filter, setFilter] = useState({
    minDate: startOfDay(subtractDays(now, 30)),
    maxDate: endOfDay(now),
  })
  const columns = [
    { key: 'Name', name: formatMessage(messages.utilizationName), prop: 'name' },
    { key: 'Total Modules', name: formatMessage(messages.utilizationTotalModules), prop: 'modules' },
    { key: 'Total Tests', name: formatMessage(messages.utilizationTotalTests), prop: 'cnt' },
    { key: 'Utilization%', name: formatMessage(messages.utilizationPercent), prop: 'rate' },
  ]

  const { isLoadingTable, tableData } = useUtilizationTable({ ...filter, tableData: 'tableData' })

  const { isLoading: isLoadingNational, data: { data: rawNational = [], WORKING_DAYS_IN_YEAR } = {} } = useQuery(
    ['tblUtilizationPage_National'],
    async () =>
      fetchWrapperForQueries({
        endpoint: '/device/annual-utilization-rate-national',
        params: nationalFilters,
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
      acc = [...acc, { type: year, value: rate }]
      return acc
    }, [])

    const start = nationalFilters.minDate.getUTCFullYear()
    const end = nationalFilters.maxDate.getUTCFullYear()
    const years = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    years.forEach(i => !data.find(i => i.type === String(i)) && data.push({ type: String(i), value: 0 }))
    return { data: orderBy(data, ['type'], ['desc']), keys: ['value'], indexBy: 'type' }
  }, [rawNational, WORKING_DAYS_IN_YEAR])

  const provincial = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const data = rawProvincial.map(province => {
      const { stateName, rates } = province
      const currentYearRate = rates.find(r => +r.year === currentYear)
      const rate = currentYearRate ? currentYearRate.rate : 0
      return { type: stateName, value: rate }
    })

    return { data, keys: ['value'], indexBy: 'type' }
  }, [rawProvincial])

  const getGraphColor = (type, data) => {
    const value = data.find(i => i.type === type)?.value
    return colors[
      value <= 20 ? 'red' : value <= 30 ? 'orange' : value <= 50 ? 'yellow' : value <= 76 ? 'lightGreen' : 'green'
    ]['500']
  }

  return (
    <PkPage
      title={formatMessage(messages.geneXpertUtilizationTitle)}
      filter={
        <PeriodSelector
          noAny
          label={formatMessage(messages.date)}
          minDate={filter.minDate || null}
          maxDate={filter.maxDate || null}
          onChange={dateValues => setFilter({ ...filter, ...dateValues })}
        />
      }
    >
      <Grid container>
        {isLoadingTable ? (
          <Grid item xs={12} my={5} alignItems="center" justifyContent="center">
            <Loading />
          </Grid>
        ) : (
          <NestedTable columns={columns} rows={tableData} hasDetail />
        )}
      </Grid>

      <Alert severity="info" sx={{ mt: '32px' }}>
        {formatMessage(messages.utilizationRate)}
      </Alert>

      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        {formatMessage(messages.nationalUtilizationTrendsAnnual)}
      </Typography>
      {isLoadingNational ? (
        <Loading />
      ) : (
        <BarGraph
          data={national.data}
          yField="type"
          xField="value"
          colors={({ type }) => getGraphColor(type, national.data)}
          isPercentage
          disableFormat
        />
      )}

      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        {formatMessage(messages.provincesUtilizationTrendsAnnual)}
      </Typography>
      {isLoadingProvincial ? (
        <Loading />
      ) : (
        <BarGraph
          data={provincial.data}
          yField="type"
          xField="value"
          colors={({ type }) => getGraphColor(type, provincial.data)}
          isPercentage
          disableFormat
        />
      )}
    </PkPage>
  )
}

export default UtilizationPage
