import React, { useState, useEffect } from 'react'
import { Grid, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import {
  StateAutocomplete,
  Loading,
  getItemsForTrendsGraph,
  LineGraph,
  AspectSelect,
  fillData,
} from '../../../../../components'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage } from '../../../../../messages'
import { formatNumber } from '../../../../../utils/utils/number'
import PkPage from '../../../components/PkPage'
import ProvinceTrendTable from '../../../components/ProvinceTrendTable'
import messages from '../../../PkDashboard.Messages'

const endpointParams = [{ assay: 'GxMtbRif' }, { assay: 'GxMtbRifUltra' }]

const ProvincialTestingTrendPage = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [filters, setFilter] = usePathFilter()
  const [graphData, setGraphData] = useState(false)
  const [tableData, setTableData] = useState([])

  const mergedParams = endpointParams
    .concat(filters.lgas.map(i => ({ lgaId: i.id })))
    .concat(filters.states.map(i => ({ stateId: i.id })))

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
      const table = getItemsForTrendsGraph(data.data, filters.states, filters.lgas).tableData

      setGraphData(graph)
      setTableData(table)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const stateName = getCustomMessage(formatMessage, messages, 'state', user, { entity: 'state' })

  return (
    <PkPage
      title={`${stateName}  ${formatMessage(messages.TBTestingTrend)}`}
      filters={
        <>
          <StateAutocomplete
            fullWidth
            countryId={user.countryId}
            value={filters.states}
            onChange={(_, newValue) => setFilter({ states: newValue, lgas: [] })}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <AspectSelect
            multiple
            fullWidth
            itemToString={i => i?.name ?? ''}
            options={filters.states.reduce((p, c) => [...p, ...c.lgas], [])}
            value={filters.lgas}
            onChange={v => setFilter(prv => ({ ...prv, lgas: v }))}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'lga' })}
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
              {stateName} {formatMessage(messages.testingTrends)}
            </Typography>
            {graphData ? (
              <div style={{ width: '100%' }}>
                <LineGraph
                  data={graphData}
                  tooltip={{
                    formatter: datum => ({ name: datum.id, value: formatNumber(datum.value) }),
                  }}
                  showLabel
                  xField="year"
                  yField="value"
                  seriesField="id"
                />
              </div>
            ) : null}
          </Grid>
          <Grid item xs={12} md={4} lg={4} container>
            {tableData ? (
              <ProvinceTrendTable
                title={`${stateName} ${formatMessage(messages.testingTrendsYear)}`}
                rows={tableData}
              />
            ) : null}
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default ProvincialTestingTrendPage
