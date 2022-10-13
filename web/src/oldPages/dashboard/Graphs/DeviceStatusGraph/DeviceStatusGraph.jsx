import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import useI18n from '../../../../hooks/useI18n'
import { graphMessages } from '../../../../messages'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import PeriodSelector from '../PeriodSelector'
import styles from '../styles.css'
import DeviceStatusGraphMain from './DeviceStatusGraph.Main'

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
            <CardHeader title={formatMessage(graphMessages.deviceStatusTitle)} />
            <CardContent>
              <Grid container spacing={8} className={cssClasses('Graph_Content')}>
                <Grid item xs={12} md={12} lg={3}>
                  <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                    <Grid item xs={12} md={4} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                      <FormControlLabel
                        label={formatMessage(graphMessages.showValuesLabel)}
                        control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                    <Grid item xs={12} md={8} lg={12} className={cssClasses('Graph_Content_AssaySelector')}>
                      <PeriodSelector onChange={setFilter} initialValue={DATE_RANGE_OPTIONS.LAST_MONTH} />
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

export default DeviceStatusGraph
