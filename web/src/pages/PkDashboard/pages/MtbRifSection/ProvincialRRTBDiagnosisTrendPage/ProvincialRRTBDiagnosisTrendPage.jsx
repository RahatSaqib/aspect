import React, { useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import Loading from '../../../../../cleanComponents/Loading'
import StateAutocomplete from '../../../../../cleanComponents/StateAutocomplete'
import EmptyGraph from '../../../../../components/Graphs/EmptyData'
import SimpleBarLine from '../../../../../components/Graphs/SimpleBarLine'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { getItemsForTrendsGraph } from '../../../../../utils/utils/misc'
import PkPage from '../../../components/PkPage'
import ProvinceTrendTable from '../../../components/ProvinceTrendTable'
import messages from '../../../PkDashboard.Messages'

const ProvincialRRTBDiagnosisTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [states, setState] = useState([])
  const mergedParams = [
    { assay: 'GxMtbRif' },
    { assay: 'GxMtbRifUltra' },
    { resultCategory1: 'Detected' },
    { resultCategory2: 'Detected' },
  ]

  const { isLoading, data: { data = [] } = {} } = useQuery(
    ['ProvincialRRTBDiagnosisTrendPage', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/gx-10c-trends-provincial', params: mergedParams })
  )

  const { graphData, tableData } = useMemo(() => getItemsForTrendsGraph(data, states), [data, states])

  return (
    <PkPage
      title={`${formatMessage(messages.provincialDiagnosisTrendsRRTBComparison)}`}
      filters={
        <StateAutocomplete
          fullWidth
          countryId={user.countryId}
          value={states}
          onChange={(_, newValue) => setState(newValue)}
          label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
        />
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} md={8} lg={8} sx={{ p: 1 }} container>
            {graphData && !isEmpty(graphData) ? (
              <SimpleBarLine title={formatMessage(messages.provincialRRDiagnosisTrends)} data={graphData} />
            ) : (
              <EmptyGraph type="bar" />
            )}
          </Grid>
          <Grid item xs={12} md={4} lg={4} container>
            <ProvinceTrendTable
              title={`${formatMessage(messages.provincialRRDiagnosisTrends)} ${new Date().getFullYear()}`}
              rows={tableData}
            />
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default ProvincialRRTBDiagnosisTrendPage
