import React, { useState } from 'react'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { ErrorRateFilter, LineGraph, Loading, StateSelect } from '../../../../../components'
import useAuthState from '../../../../../hooks/useAuthState'
import useFilterValues from '../../../../../hooks/useFilterValues'
import { getCustomMessage, graphMessages, months } from '../../../../../messages'
import { WHOBenchmark } from '../../../../../utils/consts/WHOBenchmark'
import PkPage from '../../../components/PkPage'
import useDeviceErrors from '../../../hooks/useDeviceError'
import useDeviceErrorGraph from '../../../hooks/useDeviceErrorGraph'
import messages from '../../../PkDashboard.Messages'
import { ErrorRateTable } from './ErrorRateTable'

const ErrorRateGraph = ({ category, title, user }) => {
  const { formatMessage } = useIntl()
  const [state, setState] = useState()
  const [showLabel, setShowLabel] = useState(false)
  const { data, isLoading } = useDeviceErrorGraph(omitBy({ category, state }, isNil), {
    select: array => {
      const currentYear = new Date().getFullYear()
      const monthsOfYear = Array.from({ length: 12 }, (_, i) => i + 1)
      const monthNames = monthsOfYear.map(month => formatMessage(months[month - 1]))

      if (!array.length) {
        return monthsOfYear.map(month => ({
          year: String(currentYear),
          month: monthNames[month - 1],
          value: 0,
        }))
      }

      const dataByYear = array.reduce((acc, item) => {
        if (!acc[item.year]) acc[item.year] = {}
        acc[item.year][item.month] = item.percentage
        return acc
      }, {})

      return monthsOfYear
        .flatMap(month =>
          Object.keys(dataByYear).flatMap(year => ({
            year: String(year),
            month: monthNames[month - 1],
            value: dataByYear[year][month] || 0,
          }))
        )
        .sort((a, b) => a.year - b.year || a.month - b.month)
    },
  })

  const maxValue = data?.reduce((max, item) => Math.max(max, item.value), 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', my: '25px' }}>
      <Box flex={1}>
        <Typography variant="h5" color="primary">
          {title}
        </Typography>
        <FormControlLabel
          sx={{ mt: '20px' }}
          label={formatMessage(graphMessages.showValuesLabel)}
          control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
        />
        <StateSelect
          label={getCustomMessage(formatMessage, messages, 'state', user)}
          value={state || ''}
          onChange={e => setState(e.target.value)}
          countryId={user.countryId}
          onlyAssociatedSites
        />
      </Box>
      <Box flex={3}>
        {isLoading ? (
          <Loading />
        ) : (
          <LineGraph
            tooltip={{
              formatter: datum => ({ name: datum.year, value: `${datum.value}%` }),
            }}
            yAxis={{
              label: {
                formatter: text => `${text}%`,
              },
              min: 0,
              max: maxValue + 5,
            }}
            annotations={
              !user.isCountry('PK') && [
                {
                  type: 'line',
                  start: ['min', WHOBenchmark[`${category}`]], // Start at the minimum x-value and 5% y-value
                  end: ['max', WHOBenchmark[`${category}`]], // End at the maximum x-value and 5% y-value
                  style: {
                    stroke: 'red',
                    lineDash: [4, 4],
                    lineWidth: 2,
                  },
                  text: {
                    content: `${formatMessage(messages.whoBenchmark)}(${WHOBenchmark[category]}%)`,
                    position: 'start',
                    offsetY: -10,
                    style: {
                      fill: 'red',
                      fontSize: 10,
                      fontWeight: 'bold',
                    },
                  },
                },
              ]
            }
            showLabel={showLabel}
            data={data}
            xField="month"
            yField="value"
            seriesField="year"
          />
        )}
      </Box>
    </Box>
  )
}

const ErrorRatePage = () => {
  const { formatMessage } = useIntl()
  const location = useLocation()
  const user = useAuthState()

  const filter = useFilterValues(location.pathname)
  const { data, isLoading } = useDeviceErrors({ ...filter })
  const [sort, setSort] = useState({ name: 'name', order: 'asc' })
  return (
    <PkPage
      header={<ErrorRateFilter />}
      title={formatMessage(!user.isCountry('PK') ? messages.errorRatePageTitle : messages.genExpertError)}
    >
      {isLoading ? (
        <Loading />
      ) : (
        <ErrorRateTable showTotal={!user.isCountry('PK')} sort={sort} onSortChange={setSort} items={data} />
      )}
      <ErrorRateGraph title={formatMessage(messages.nationalErrorRates)} user={user} category="error" />
      <ErrorRateGraph title={formatMessage(messages.nationalInvalidRates)} user={user} category="invalid" />
      <ErrorRateGraph title={formatMessage(messages.nationalNoResultRates)} user={user} category="noResult" />
    </PkPage>
  )
}

export default ErrorRatePage
