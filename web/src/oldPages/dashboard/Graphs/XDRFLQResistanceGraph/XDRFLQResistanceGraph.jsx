import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, FormControl, InputLabel } from '@mui/material'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import classnames from 'classnames/bind'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../../components/Graphs/GraphsContainer/messages'
import Loading from '../../../../components/Loading'
import useStatesByCountry from '../../../../hooks/geography/useStatesByCountry'
import useI18n from '../../../../hooks/useI18n'
import { useAuthState } from '../../../../providers/AuthProvider'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import styles from './styles.css'
import XDRFLQResistanceGraphMain from './XDRFLQResistanceGraph.Main'

const cssClasses = classnames.bind(styles)

const XDRFLQResistanceGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

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
                      <XDRFLQResistanceGraphMain
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
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

const StateSelector = ({ onChange }) => {
  const { countryId } = useAuthState()
  const { data, isLoading } = useStatesByCountry(countryId)
  const [innerValue, setInnerValue] = useState('')

  return isLoading ? (
    <Loading />
  ) : (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-state">State</InputLabel>
      <Select
        labelId="select-state"
        value={innerValue}
        onChange={e => {
          setInnerValue(e.target.value)
          onChange({ stateId: `${e.target.value}` })
        }}
      >
        {data.map(o => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default XDRFLQResistanceGraph
