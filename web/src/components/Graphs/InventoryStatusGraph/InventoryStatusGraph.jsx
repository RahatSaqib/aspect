import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { graphMessages } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import ConsumableSelector from '../../ConsumableSelector'
import { Loading, ColumnGraph, genLabel } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'

const i18nKeys = {
  moreThan180: 'moreThan180',
  noConsumption: 'noConsumption',
  notRecorded: 'notRecorded',
  outOfStock: 'outOfStock',
  upTo14: 'upTo14',
  upTo30: 'upTo30',
  upTo90: 'upTo90',
  upTo180: 'upTo180',
}

const InventoryStatusGraph = ({ assaysFromState }) => {
  const { formatMessage } = useIntl()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState(null)
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const cleanFilter = filter ? { consumableExternalId: filter.consumableExternalId } : null

  const { isLoading, data } = useQuery(
    ['suppliesExpiryByPeriod', { cleanFilter }],
    async ({ queryKey: [, { cleanFilter }] }) => {
      if (cleanFilter) return fetchWrapperForQueries({ endpoint: '/inventory/days-by-location', cleanFilter })
    },
    { ...GRAPHS_QUERY_OPTIONS }
  )

  const barData = useMemo(() => {
    if (!assaysFromState || !data?.data || !filter) return { data: [] }

    const info = data.data.filter(r => r.consumableId === filter?.consumableId)[0] || {}
    const allKeysButMonth = Object.keys(info).filter(key => key !== 'consumableId' && key !== 'consumableName')
    const expandedBarData = []
    allKeysButMonth.map(key =>
      expandedBarData.push({
        id: key,
        consumableName: info.consumableName,
        consumableId: info.consumableId,
        value: +info[key],
        type: genLabel(key, assaysFromState, formatMessage, messages, i18nKeys),
      })
    )
    return { data: expandedBarData }
  }, [data, assaysFromState, filter, formatMessage])

  return (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.inventoryGraphStatus)} />
          <CardContent>
            <Grid container spacing={1} className={styles.Graph_Content}>
              <Grid item xs={12} md={12} lg={2}>
                <Grid container spacing={2} className={styles.Graph_Content_Container}>
                  <Grid item xs={12} md={4} lg={12} className={styles.Graph_Content_ShowLabel}>
                    <FormControlLabel
                      label={formatMessage(graphMessages.showValuesLabel)}
                      control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                    />
                  </Grid>
                  <Grid item xs={12} md={8} lg={12} className={styles.Graph_Content_AssaySelector}>
                    <ConsumableSelector fullWidth value={filter} onChange={setFilter} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={10}>
                <Grid container>
                  {isLoading ? (
                    <Loading />
                  ) : (
                    <Grid item xs={12} md={12} lg={12}>
                      {barData.data && barData.data.length ? (
                        <ColumnGraph
                          data={barData.data}
                          graphId="suppliesExpiryByPeriod"
                          xField="type"
                          yField="value"
                          showLabel={showLabel}
                          onReady={plot => {
                            plot.on('plot:click', evt => {
                              const params = {
                                daysStockLeft: evt.data.data.id,
                                consumableId: evt.data.data.consumableId,
                              }
                              addFilter(params, '/browse/inventory/supplies')
                              navigate('/browse/inventory/supplies')
                            })
                          }}
                        />
                      ) : null}
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default InventoryStatusGraph
