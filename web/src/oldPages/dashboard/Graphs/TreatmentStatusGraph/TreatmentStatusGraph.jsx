import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../../cleanComponents/ErrorBoundary'
import Loading from '../../../../cleanComponents/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { graphMessages } from '../../../../messages'
import { getWhitelistedAssays } from '../../../../utils/utils/graph'
import styles from '../styles.css'
import MainGraph from './TreatmentStatusGraph.Main'
import SideGraph from './TreatmentStatusGraph.Side'

const cssClasses = classnames.bind(styles)

const assays = [
  'abbottM2000DBSHivVL',
  'abbottM2000PlasmaHivVL',
  'assayAlereQHiv12Detect',
  'assayAlereQHiv12VLPlasma',
  'assayCobasHivVl',
  'GxHiv1Vl',
  'QHivVL',
  'ReporterHivVL',
]

const endPointParams = {
  minDate: startOfMonth(subMonths(new Date(), 12)),
  maxDate: endOfMonth(subMonths(new Date(), 1)),
}

const TreatmentStatusGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(false)

  const whiteListed = getWhitelistedAssays({ assays, assaysFromState })

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/confirmed-treatment-tracking', params: endPointParams })
  )

  return isLoading ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphMessages.treatmentGraphStatusMonthly)} />
            <CardContent>
              <Grid container spacing={1} className={cssClasses('Graph_Content')}>
                <Grid item xs={12} md={12} lg={2}>
                  <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                    <Grid item xs={12} md={12} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                      <FormControlLabel
                        label={formatMessage(graphMessages.showValuesLabel)}
                        control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={10}>
                  <Grid container>
                    <MainGraph
                      rawData={data.data}
                      assaysFromState={assaysFromState}
                      whiteListed={whiteListed}
                      showLabel={showLabel}
                    />
                    <SideGraph
                      rawData={data.data}
                      assaysFromState={assaysFromState}
                      whiteListed={whiteListed}
                      showLabel={showLabel}
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

export default TreatmentStatusGraph
