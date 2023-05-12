import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect } from '../../../../../cleanComponents'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../../components/Loading'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import TestsOverTimeGraphMain from '../../../../../oldPages/dashboard/Graphs/TestsOverTimeGraph/TestsOverTimeGraph.Main'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'
import TestsOverTimeGraphHalf from './CurrentDiagnosisGraph.Half'

const endPointParams = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { resultCategory1: 'Detected' },
  { resultCategory2: 'Detected' },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const CurrentDiagnosisGraphPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState([])
  const [state, setState] = useState()
  const [, setLga] = useState()
  const { data: assays } = useAssayList()

  useEffect(() => {
    if (assays) {
      const tbAssays = assays.filter(a => a.assayTypeAbbreviation === 'TB')
      const defaultFilter = tbAssays.length > 0 ? tbAssays : assays
      setFilter(defaultFilter)
    }
  }, [assays])

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-testing-aggregations', params: endPointParams })
  )

  return (
    <PkPage
      title={formatMessage(messages.rifCurrentRRTBDiagnosisTitle)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            countryId={user.countryId}
            onChange={e => setState(e.target.value)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            stateId={state}
            onChange={e => setLga(e.target.value)}
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
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
            filterSelection={filter}
          />
          <TripleCardSide
            data={[
              { label: formatMessage(messages.RRPerYear), value: `${data.totalResultsCurrentYear}` },
              { label: formatMessage(messages.RRPerMonth), value: `${data.averageTestsPerMonthCurrentYear}` },
              { label: formatMessage(messages.RRPerDay), value: `${data.totalResultsInLast24Hours}` },
            ]}
          />
          <TestsOverTimeGraphHalf
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
            filterSelection={filter}
          />
          <TestsOverTimeGraphHalf
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
            filterSelection={filter}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentDiagnosisGraphPage
