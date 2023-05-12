import React, { useState } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../../components/Loading'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages } from '../../../../../messages'
import HivResultsGraphMain from '../../../../../oldPages/dashboard/Graphs/HivResultsGraph/HivResultsGraph.Main'
import HivResultsGraphSide from '../../../../../oldPages/dashboard/Graphs/HivResultsGraph/HivResultsGraph.Side'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const endPointParams = [
  { assay: 'GxHiv1Vl' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const HivGraphPage = () => {
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(true)
  const { data: assays } = useAssayList()

  const { data, isLoading } = useQuery(
    ['hivByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-testing-aggregations', params: endPointParams })
  )

  return (
    <PkPage
      title={`${formatMessage(messages.hiv)} / ${formatMessage(graphMessages.clinicalIndicatorsVLTitle)}`}
      filters={
        <FormControlLabel
          sx={{ minWidth: '145px' }}
          label={formatMessage(graphMessages.showValuesLabel)}
          control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
        />
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <HivResultsGraphMain
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
          />
          <HivResultsGraphSide
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default HivGraphPage
