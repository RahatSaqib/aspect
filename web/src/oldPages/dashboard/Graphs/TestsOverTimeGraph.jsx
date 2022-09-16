import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Checkbox, FormControlLabel } from '@mui/material'
import Grid from '@mui/material/Grid'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import { useQuery } from 'react-query'
import FilterByAssayDropDown from '../../../components/AspectDropDown/FilterByAssayDropDown'
import ErrorBoundary from '../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../components/Graphs/GraphsContainer/messages'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../components/Loading'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import TestsOverTimeGraphMain from './TestsOverTimeGraph.Main'
import TestsOverTimeGraphSide from './TestsOverTimeGraph.Side'

const selectorModifiers = [
  {
    component: FilterByAssayDropDown,
    identifier: 'assayId',
    isClearable: true,
    isClientSide: true,
    initByCountryDefault: true,
    initByCountryDefaultGroup: 'TB',
    filterFunctions: [
      {
        id: 'testPerformedMonthlyPercentage',
        filterFunction: (data, props) => {
          const newData = []
          const keys = ['month']
          map(props, ({ value }) => keys.push(value))
          map(data, row => newData.push(pick(row, keys)))
          return newData
        },
      },
      {
        id: 'testPerformedMonthlytotal',
        filterFunction: (data, props) => {
          const newData = []
          const keys = []
          map(props, ({ value }) => keys.push(value))
          map(keys, key => {
            const found = filter(data, { id: key })[0]
            if (!isEmpty(found)) {
              return newData.push(found)
            }
          })
          return newData
        },
      },
    ],
  },
]

const endPointParams = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const TestsOverTimeGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [clientSideFilters, setClientSideFilters] = useState(false)
  const [clientSideFilterOptions, setClientSideFilterOptions] = useState(false)

  const updateGraphClientSide = params => setClientSideFilters(params)

  const clientSideFilter = {
    identifier: 'assayId',
    isClientSide: true,
    selectorModifiers,
    clientSideFilters,
    clientSideFilterOptions,
    setClientSideFilterOptions,
  }

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
  )

  return isLoading ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <PermissionsProvider permissions={['dashboard']}>
        <Grid container style={{ marginTop: 6 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={formatMessage(graphsContainerMessages.testsOverTimeTitle)}
                action={
                  <Grid container spacing={2} style={{ alignItems: 'center' }}>
                    <Grid item xs={9}>
                      <FilterByAssayDropDown
                        props={{
                          actionComponentProps: {
                            selectorModifiers,
                            data: clientSideFilterOptions,
                          },
                          action: params => updateGraphClientSide(params),
                        }}
                      />
                    </Grid>
                    <Grid item xs={3} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <FormControlLabel
                        label={formatMessage(graphsContainerMessages.showValuesLabel)}
                        control={<Checkbox checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                  </Grid>
                }
              />
              <CardContent>
                <Grid
                  container
                  spacing={8}
                  style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', minHeight: '350px' }}
                >
                  <TestsOverTimeGraphMain
                    data={data.data}
                    endPointParams={endPointParams}
                    assaysFromState={assaysFromState}
                    clientSideFilter={clientSideFilter}
                    showLabel={showLabel}
                  />
                  <TestsOverTimeGraphSide
                    data={data.data}
                    endPointParams={endPointParams}
                    assaysFromState={assaysFromState}
                    clientSideFilter={clientSideFilter}
                    showLabel={showLabel}
                  />
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraph
