import React, { useState, useEffect } from 'react'
import { Grid, Typography } from '@mui/material'
import { useQuery } from 'react-query'
import {
  StateAutocomplete,
  Loading,
  getItemsForTrendsGraph,
  LineGraph,
  AspectSelect,
  fillData,
} from '../../../../../cleanComponents'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import ProvinceTrendTable from '../../../components/ProvinceTrendTable'
import messages from '../../../PkDashboard.Messages'

const endpointParams = [{ assay: 'GxMtbRif' }, { assay: 'GxMtbRifUltra' }]

const ProvincialTestingTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [states, setState] = useState([])
  const [lgas, setLgas] = useState([])

  const [graphData, setGraphData] = useState(false)
  const [tableData, setTableData] = useState([])

  const mergedParams = endpointParams
    .concat(lgas.map(i => ({ lgaId: i.id })))
    .concat(states.map(i => ({ stateId: i.id })))

  const { isLoading, data } = useQuery(
    ['tblProvincialTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/gx-10c-trends-provincial', params: mergedParams })
  )

  useEffect(() => {
    if (data?.data) {
      const grouped = []
      data.data.map(item =>
        item.trends.map(trend => grouped.push({ id: item.locationName, year: trend.year, value: trend.cntAll }))
      )

      const graph = fillData(grouped).sort((a, b) => a.year - b.year)
      const table = getItemsForTrendsGraph(data.data, states, lgas).tableData

      setGraphData(graph)
      setTableData(table)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <PkPage
      title={`${formatMessage(messages.provincialTBTestingTrends)}`}
      filters={
        <>
          <StateAutocomplete
            fullWidth
            countryId={user.countryId}
            value={states}
            onChange={(_, newValue) => {
              setState(newValue)
              setLgas([])
            }}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <AspectSelect
            multiple
            fullWidth
            itemToString={i => i?.name ?? ''}
            options={states.reduce((p, c) => [...p, ...c.lgas], [])}
            value={lgas}
            onChange={v => setLgas(v)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} md={8} lg={8} container>
            <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
              {formatMessage(messages.provincialTestingTrends)}
            </Typography>
            {graphData ? (
              <div style={{ width: '100%' }}>
                <LineGraph data={graphData} showLabel xField="year" yField="value" seriesField="id" />
              </div>
            ) : null}
          </Grid>
          <Grid item xs={12} md={4} lg={4} container>
            {tableData ? (
              <ProvinceTrendTable title={formatMessage(messages.provincialTestingTrendsYear)} rows={tableData} />
            ) : null}
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default ProvincialTestingTrendPage
