import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { PeriodSelector, ErrorBoundary } from '../../../../cleanComponents'
import { getTimePeriod } from '../../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../../hooks/useI18n'
import { graphMessages } from '../../../../messages'
import styles from '../styles.css'
import ResultTransmittedGraphMain from './ResultTransmittedGraph.Main'

const cssClasses = classnames.bind(styles)

const ResultTransmittedGraph = () => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState({
    minDate: getTimePeriod(1, 'months', 'yyyy-MM-dd'),
    maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
  })
  return (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphMessages.resultsTransmittedTitle)} />
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
                      <PeriodSelector
                        label={formatMessage(graphMessages.date)}
                        minDate={filter.minDate || null}
                        maxDate={filter.maxDate || null}
                        onChange={dateValues => {
                          const newValues = Object.keys(dateValues).map(
                            // eslint-disable-next-line prefer-destructuring
                            key => (dateValues[key] = dateValues[key].toISOString().split('T')[0])
                          )
                          setFilter({ ...filter, ...newValues })
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={10}>
                  <Grid container>
                    <ResultTransmittedGraphMain showLabel={showLabel} filterSelection={filter} />
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

export default ResultTransmittedGraph
