import React, { useState } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import { useQuery } from 'react-query'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import Loading from '../../../../../cleanComponents/Loading'
import SimpleBarGraph from '../../../../../components/Graphs/SimpleBarGraph/SimpleBarGraph'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { objectToArray } from '../../../../../utils/utils/misc'
import GraphTitle from '../../../components/GraphTitle'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))

const defaultFilters = [
  { assay: 'GxMtbXdr' },
  { groupBy: 'month' },
  { resistance: 'FLQ' },
  { minDate: startOfYearUTC },
  { maxDate: endOfYearUTC },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const CurrentFQTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState({})
  const { data, isLoading } = useQuery(
    ['mtbXdrFqDetected', { endPointParams: objectToArray(filter).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  return (
    <PkPage
      title={formatMessage(messages.currentFQDetection)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filter?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter?.lgaId ?? ''}
            stateId={filter?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} md={8} lg={8}>
            <GraphTitle>{formatMessage(messages.FQRCurrentYear)}</GraphTitle>
            <SimpleBarGraph
              data={data?.data?.map(({ cnt, ...i }) => ({ 'FQ Detected': cnt, ...i }))}
              keys={['FQ Detected']}
              legends={[]}
              indexBy="month"
              enableLabel={showLabel}
            />
          </Grid>
          <TripleCardSide
            data={[
              { label: formatMessage(messages.FQRPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.FQRPerMonth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(1)}`,
              },
              { label: formatMessage(messages.FQRPerDay), value: `${data.totalResultsInLast24Hours}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentFQTrendPage
