import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, FormControl, InputLabel } from '@mui/material'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import classnames from 'classnames/bind'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../../components/Graphs/GraphsContainer/messages'
import { dateRangeOptions } from '../../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../../hooks/useI18n'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import DeviceStatusGraphMain from './DeviceStatusGraph.Main'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const DeviceStatusGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()
  return (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphsContainerMessages.deviceStatusTitle)} />
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
                      <PeriodSelector onChange={setFilter} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={9}>
                  <Grid container>
                    <DeviceStatusGraphMain
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

const PeriodSelector = ({ onChange }) => {
  const options = dateRangeOptions('deviceDateRange').deviceDateRange.sort((a, b) => `${a.id}`.localeCompare(b.id))

  const [innerValue, setInnerValue] = useState(DATE_RANGE_OPTIONS.LAST_MONTH)

  return (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-period">Period</InputLabel>
      <Select
        labelId="select-period"
        value={innerValue}
        onChange={e => {
          setInnerValue(e.target.value)
          onChange(options.filter(o => o.id === e.target.value)[0].value)
        }}
      >
        {options.map(o => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default DeviceStatusGraph
