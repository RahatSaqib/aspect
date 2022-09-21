import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Grid,
} from '@mui/material'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import ConsumableDropDown from '../../../../components/AspectDropDown/ConsumableDropDown'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import BarGraph from '../../../../components/Graphs/BarGraph'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import graphsContainerMessages from '../../../../components/Graphs/GraphsContainer/messages'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const inventoryStatus = {
  id: 'inventoryStatus',
  title: 'inventoryGraphStatus',
  assays: [],
  selectorModifiers: [
    {
      component: ConsumableDropDown,
    },
  ],
  componentSize: 'full',
  group: 'assaysNotNeeded',
  graphRenderPermissions: ['dashboard', 'operationalData'],
  graphType: [
    {
      id: 'suppliesExpiryByPeriod',
      component: BarGraph,
      type: 'barInventory',
      size: 12,
      i18nKey: {
        moreThan180: 'moreThan180',
        noConsumption: 'noConsumption',
        notRecorded: 'notRecorded',
        outOfStock: 'outOfStock',
        upTo14: 'upTo14',
        upTo30: 'upTo30',
        upTo90: 'upTo90',
        upTo180: 'upTo180',
      },
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: '/inventory/days-by-location',
      },
      sortByKeys: ['consumableName'],
      indexBy: 'increment',
      keyToConsume: 'count',
      filterBy: {},
      tickValuesYShape: 'twos',
      tickValuesXShape: 'all',
      displayMethod: 'actual',
      displayLegend: false,
      formatDate: 'MMM yy',
      clickThrough: {
        allow: true,
        baseUrl: '/browse/inventory?filters=',
        keys: [
          'daysStockLeft',
          'consumableId',
          id => {
            if (id === 'noConsumption') {
              return {
                hasStock: true,
              }
            }
          },
        ],
      },
    },
  ],
}

const InventoryStatusGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [, setFilter] = useState()
  return (
    <ErrorBoundary>
      <PermissionsProvider permissions={['dashboard', 'operationalData']}>
        <Grid container className={cssClasses('Graph_Container')}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title={formatMessage(graphsContainerMessages.inventoryGraphStatus)} />
              <CardContent>
                <Grid container spacing={8} className={cssClasses('Graph_Content')}>
                  <Grid item xs={12} md={12} lg={3}>
                    <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                      <Grid item xs={12} md={4} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                        <FormControlLabel
                          label={formatMessage(graphsContainerMessages.showValuesLabel)}
                          control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={8} lg={12} className={cssClasses('Graph_Content_AssaySelector')}>
                        <ConsumableSelector onChange={setFilter} />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={12} lg={9}>
                    <Grid container>
                      <GraphsContainer assaysFromState={assaysFromState} config={inventoryStatus} />
                      {/* <DeviceStatusGraphMain
                        assaysFromState={assaysFromState}
                        showLabel={showLabel}
                        filterSelection={filter}
                      /> */}
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

const ConsumableSelector = ({ onChange }) => {
  const [innerValue, setInnerValue] = useState('')
  const [options, setOptions] = useState([])
  const { isLoading, data } = useQuery('data.inventoryConsumableSummaryList', async () =>
    fetchWrapperForQueries({ endpoint: '/dashboard/inventory-item' })
  )

  useEffect(() => {
    if (data) {
      const opt = data.data.inventoryConsumableSummaryList.sort((a, b) =>
        `${a.consumableName}`.localeCompare(b.consumableName)
      )
      setOptions(opt)
      setInnerValue(opt[0].consumableExternalId)
    }
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-consumable">Consumable</InputLabel>
      <Select
        labelId="select-consumable"
        value={innerValue}
        onChange={e => {
          setInnerValue(e.target.value)
          onChange(options.filter(o => o.id === e.target.value)[0].value)
        }}
      >
        {options.map(o => (
          <MenuItem key={o.consumableExternalId} value={o.consumableExternalId}>
            {o.consumableName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default InventoryStatusGraph
