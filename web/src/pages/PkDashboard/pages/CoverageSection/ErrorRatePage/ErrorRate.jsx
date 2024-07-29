import React, { useState } from 'react'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { ErrorRateFilter, LineGraph, Loading, StateSelect } from '../../../../../cleanComponents'
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
    select: array =>
      array
        .sort((a, b) => a.month - b.month)
        .map(item => ({
          year: String(item.year),
          month: `${formatMessage(months[item.month - 1])}`,
          value: item.percentage,
        })),
  })
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
          countryId={user?.countryId}
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
            }}
            annotations={[
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
                  content: `WHO Benchmark(${WHOBenchmark[category]}%)`,
                  position: 'start',
                  offsetY: -10,
                  style: {
                    fill: 'red',
                    fontSize: 10,
                    fontWeight: 'bold',
                  },
                },
              },
            ]}
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
      user={user}
      title={formatMessage(!user.isCountry('PK') ? messages.errorRatePageTitle : messages.genExpertError)}
    >
      {isLoading ? <Loading /> : <ErrorRateTable sort={sort} onSortChange={setSort} items={data} />}
      <ErrorRateGraph title={formatMessage(messages.nationalErrorRates)} category="error" />
      <ErrorRateGraph title={formatMessage(messages.nationalInvalidRates)} category="invalid" />
      <ErrorRateGraph title={formatMessage(messages.nationalNoResultRates)} category="noResult" />
    </PkPage>
  )
}

export default ErrorRatePage
