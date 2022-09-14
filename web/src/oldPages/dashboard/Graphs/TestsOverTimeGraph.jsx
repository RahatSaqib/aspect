import React, { useState } from 'react'
import { Card, CardHeader } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import { useQuery } from 'react-query'
import FilterByAssayDropDown from '../../../components/AspectDropDown/FilterByAssayDropDown'
import ErrorBoundary from '../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../components/Graphs/GraphsContainer/messages'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import GraphContainerStyles from './GraphsContainer.css'
import TestsOverTimeGraphMain from './TestsOverTimeGraph.Main'
import TestsOverTimeGraphSide from './TestsOverTimeGraph.Side'

const cssClasses = classnames.bind(GraphContainerStyles)

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

const Loading = () => (
  <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <CircularProgress />
  </div>
)

const endPointParams = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const TestsOverTimeGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

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
        <Grid container direction="row" spacing={8}>
          <Grid item xs={12} lg={12}>
            <Grid container>
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title={formatMessage(graphsContainerMessages.testsOverTimeTitle)}
                    action={
                      <FilterByAssayDropDown
                        props={{
                          actionComponentProps: {
                            selectorModifiers,
                            data: clientSideFilterOptions,
                          },
                          action: params => updateGraphClientSide(params),
                        }}
                      />
                    }
                  />
                  <Grid container spacing={8} className={cssClasses('graph__containerGrid')}>
                    <TestsOverTimeGraphMain
                      data={data.data}
                      endPointParams={endPointParams}
                      assaysFromState={assaysFromState}
                      clientSideFilter={clientSideFilter}
                    />
                    <TestsOverTimeGraphSide
                      data={data.data}
                      endPointParams={endPointParams}
                      assaysFromState={assaysFromState}
                      clientSideFilter={clientSideFilter}
                    />
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraph
