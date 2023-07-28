import React, { useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import { useQuery } from 'react-query'
import Loading from '../../../../../cleanComponents/Loading'
import StateAutocomplete from '../../../../../cleanComponents/StateAutocomplete'
import SimpleBarLine from '../../../../../components/Graphs/SimpleBarLine'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { getItemsForTrendsGraph } from '../../../../../utils/utils/misc'
import PkPage from '../../../components/PkPage'
import ProvinceTrendTable from '../../../components/ProvinceTrendTable'
import messages from '../../../PkDashboard.Messages'

const ProvincialDiagnosisTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [states, setState] = useState([])
  const mergedParams = [{ assay: 'GxMtbXdr' }, { resultCategory1: 'Detected' }]

  const { isLoading, data: { data = [] } = {} } = useQuery(
    ['ProvincialDiagnosisTrendPage_Xdr', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/gx-10c-trends-provincial', params: mergedParams })
  )

  const items = useMemo(() => getItemsForTrendsGraph(data, states), [data, states])

  return (
    <PkPage
      title={`${formatMessage(messages.TbDProvincialComparison)}`}
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
            <SimpleBarLine data={items?.map(({ province, trends }) => ({ id: province, data: trends }))} />
          </Grid>
          <Grid item xs={12} md={4} lg={4} container>
            <ProvinceTrendTable rows={items} />
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default ProvincialDiagnosisTrendPage
