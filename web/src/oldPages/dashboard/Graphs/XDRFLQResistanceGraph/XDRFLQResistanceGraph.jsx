import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, FormControl, InputLabel } from '@mui/material'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import classnames from 'classnames/bind'
import FilterByStateDropDown from '../../../../components/AspectDropDown/FilterByStateDropDown'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import BarGraph from '../../../../components/Graphs/BarGraph'
import AxisRightLayer from '../../../../components/Graphs/BarGraph/AxisRightLayer'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import graphsContainerMessages from '../../../../components/Graphs/GraphsContainer/messages'
import { getTimePeriod } from '../../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../../hooks/useI18n'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import styles from './styles.css'
import { FqrToMtbPercentageLine } from './XDRFLQResistanceGraph.Layers'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const xdrPercentageFQRDetectedOverMTBDetected = {
  id: 'xdrPercentageFQRDetectedOverMTBDetectedGraph',
  title: 'xdrPercentageFQRDetectedOverMTBDetectedGraphTitle',
  assays: ['GxMtbXdr'],
  componentSize: 'full',
  group: 'xdr',
  graphRenderPermissions: ['dashboard'],
  graphType: [
    {
      id: 'xdrAssayGraph',
      component: BarGraph,
      type: 'bar-line',
      size: 12,
      componentClasses: [],
      indexBy: 'month', // is used for setting jsx `key` in loops
      fields: [
        { name: 'TotalTests', colorId: 'caseTotal', target: 'bar' },
        {
          name: 'MtbDetected',
          colorId: '--aspect-color-slate',
          target: 'bar',
        },
        { name: 'FqrDetected', colorId: 'caseDetected', target: 'bar' },
        {
          name: 'FqrToMtbPercentage',
          colorId: 'casePercentDetectedOfTotal',
          target: 'line',
        },
      ],
      keyToConsume: '',
      filterBy: {},
      groupMode: 'grouped',
      tickValuesYShape: 'twos',
      tickValuesXShape: 'all',
      isServerSide: true,
      layers: [FqrToMtbPercentageLine, AxisRightLayer],
      axisRightProps: {
        fieldName: 'FqrToMtbPercentage',
      },
      api: {
        endpoint: '/result/xdr-assay-graph',
        params: {
          [MIN_DATE]: '2022-01-01',
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
        isServerSide: true,
      },
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: (value, i18n) => {
        /**
         * 'value' has pattern `yyyy-mm` (i.e. `2022-07`), and to correctly
         * format it to `Jul-22` with taking into account timezones, let's
         * consider mid-month date - so, convert `yyyy-mm` to `yyyy-mm-15`
         */
        return i18n.format(new Date(`${value}-15`), 'MMM-yy')
      },
      clickThrough: false,
    },
  ],
  selectorModifiers: [
    {
      component: FilterByStateDropDown,
      identifier: 'stateId', // for query param name
      isClearable: true,
      isClientSide: true,
      filterFunctions: [
        {
          id: 'xdrAssayGraph',
          shouldFilterOnServer: true,
        },
      ],
    },
  ],
}
const cssClasses = classnames.bind(styles)

const XDRFLQResistanceGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [, setFilter] = useState()

  return (
    <ErrorBoundary>
      <PermissionsProvider permissions={['dashboard']}>
        <Grid container className={cssClasses('Graph_Container')}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={formatMessage(graphsContainerMessages.xdrPercentageFQRDetectedOverMTBDetectedGraphTitle)}
              />
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
                        <StateSelector onChange={setFilter} />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={12} lg={9}>
                    <Grid container>
                      <GraphsContainer
                        assaysFromState={assaysFromState}
                        config={xdrPercentageFQRDetectedOverMTBDetected}
                      />

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

const StateSelector = ({ onChange }) => {
  const [options] = useState([])
  const [innerValue, setInnerValue] = useState('')

  return (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-state">State</InputLabel>
      <Select
        labelId="select-state"
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

export default XDRFLQResistanceGraph
