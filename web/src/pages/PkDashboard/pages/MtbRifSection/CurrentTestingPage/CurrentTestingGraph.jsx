import React, { useState } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import { useQuery } from 'react-query'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import Loading from '../../../../../cleanComponents/Loading'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { objectToArray } from '../../../../../utils/utils/misc'
import PkPage from '../../../components/PkPage'
import TestsOverTimeGraphMain from '../../../components/TestsOverTimeGraph.Main'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const defaultFilters = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const RifCurrentGraphPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState()
  const { data: assays } = useAssayList()
  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams: objectToArray(filter ?? {}).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  return (
    <PkPage
      title={formatMessage(messages.peopleTestedRif)}
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
          <TestsOverTimeGraphMain
            title={formatMessage(messages.testsPerformedYear)}
            data={data.data}
            assaysFromState={assays}
            showLabel={showLabel}
          />
          <TripleCardSide
            data={[
              { label: formatMessage(messages.testPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.testPerMonth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(1)}`,
              },
              { label: formatMessage(messages.testPerDay), value: `${data.totalResultsInLast24Hours}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default RifCurrentGraphPage
