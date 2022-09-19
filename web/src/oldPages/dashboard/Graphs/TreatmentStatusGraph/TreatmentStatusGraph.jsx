import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel } from '@mui/material'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../../components/Graphs/GraphsContainer/messages'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import { getWhitelistedAssays } from '../../../../utils/utils/graph'
import styles from './styles.css'
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
      <PermissionsProvider permissions={[...whiteListed, 'dashboard', '+reporter']}>
        <Grid container className={cssClasses('Graph_Container')}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title={formatMessage(graphsContainerMessages.treatmentGraphStatusMonthly)} />
              <CardContent>
                <Grid container spacing={8} className={cssClasses('Graph_Content')}>
                  <Grid item xs={12} md={12} lg={3}>
                    <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                      <Grid item xs={12} md={12} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                        <FormControlLabel
                          label={formatMessage(graphsContainerMessages.showValuesLabel)}
                          control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={12} lg={9}>
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
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default TreatmentStatusGraph
