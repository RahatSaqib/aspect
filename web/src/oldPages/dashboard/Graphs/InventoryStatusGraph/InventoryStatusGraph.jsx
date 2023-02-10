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
import ErrorBoundary from '../../../../components/ErrorBoundary'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { graphMessages, consumableMessages } from '../../../../messages'
import styles from '../styles.css'
import InventoryStatusGraphMain from './InventoryStatusGraph.Main'

const cssClasses = classnames.bind(styles)

const InventoryStatusGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

  return (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphMessages.inventoryGraphStatus)} />
            <CardContent>
              <Grid container spacing={1} className={cssClasses('Graph_Content')}>
                <Grid item xs={12} md={12} lg={2}>
                  <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                    <Grid item xs={12} md={4} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                      <FormControlLabel
                        label={formatMessage(graphMessages.showValuesLabel)}
                        control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                    <Grid item xs={12} md={8} lg={12} className={cssClasses('Graph_Content_AssaySelector')}>
                      <ConsumableSelector onChange={setFilter} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={10}>
                  <Grid container>
                    <InventoryStatusGraphMain
                      assaysFromState={assaysFromState}
                      showLabel={showLabel}
                      filterSelection={filter}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ErrorBoundary>
  )
}

const ConsumableSelector = ({ onChange }) => {
  const [innerValue, setInnerValue] = useState('')
  const [options, setOptions] = useState([])
  const { isLoading, data } = useQuery('data.inventoryConsumableSummaryList', async () =>
    fetchWrapperForQueries({ endpoint: '/dashboard/inventory-item' })
  )
  const { formatMessage } = useI18n()
  useEffect(() => {
    if (data) {
      const opt = data.data.inventoryConsumableSummaryList.sort((a, b) =>
        `${a.consumableName}`.localeCompare(b.consumableName)
      )
      setOptions(opt)
      setInnerValue(opt[0]?.consumableExternalId)
      onChange({ consumableExternalId: opt[0]?.consumableExternalId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-consumable">{formatMessage(consumableMessages.consumable)}</InputLabel>
      <Select
        labelId="select-consumable"
        value={innerValue}
        onChange={e => {
          setInnerValue(e.target.value)
          onChange({
            consumableExternalId: options.filter(o => o.consumableExternalId === e.target.value)[0]
              .consumableExternalId,
          })
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
