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
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const endPointParams = [
  { assay: 'assayGXCovid19' },
  { assay: 'assayGenericCovid19' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS' },
]

const CovidGraphPage = () => {
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(true)
  const { data: assays } = useAssayList()

  const { data, isLoading } = useQuery(
    ['covidByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
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
          <TripleCardSide
            data={[
              { label: formatMessage(messages.testPerYear), value: 123 },
              { label: formatMessage(messages.testPerMonth), value: 456 },
              { label: formatMessage(messages.testPerDay), value: 799 },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CovidGraphPage
