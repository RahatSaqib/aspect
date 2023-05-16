import React, { useState } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../../components/Loading'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages } from '../../../../../messages'
import CovidResultGraphMain from '../../../../../oldPages/dashboard/Graphs/CovidResultGraph/CovidResultGraph.Main'
import CovidResultGraphSide from '../../../../../oldPages/dashboard/Graphs/CovidResultGraph/CovidResultGraph.Side'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const endPointParams = [
  { assay: 'assayGXCovid19' },
  { assay: 'assayGenericCovid19' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const CovidGraphPage = () => {
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(true)
  const { data: assays } = useAssayList()

  const { data, isLoading } = useQuery(
    ['covidByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  return (
    <PkPage
      title={`${formatMessage(messages.covid)} / ${formatMessage(graphMessages.clinicalIndicatorsCovidTitle)}`}
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
          <CovidResultGraphMain
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
          />
          <CovidResultGraphSide
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

export default CovidGraphPage
