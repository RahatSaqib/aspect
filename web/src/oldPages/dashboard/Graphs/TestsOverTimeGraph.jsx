import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import AspectCard from '../../../components/AspectCard'
import FilterByAssayDropDown from '../../../components/AspectDropDown/FilterByAssayDropDown'
import ErrorBoundary from '../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../components/Graphs/GraphsContainer/messages'
import useI18n from '../../../hooks/useI18n'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import GraphContainerStyles from './GraphsContainer.css'
import TestsOverTimeGraphMain from './TestsOverTimeGraph.Main'
import TestsOverTimeGraphSide from './TestsOverTimeGraph.Side'

const cssClasses = classnames.bind(GraphContainerStyles)

const filterMonthlyByAssaysBar = (data, props) => {
  const newData = []
  const keys = ['month']
  map(props, ({ value }) => keys.push(value))
  map(data, row => newData.push(pick(row, keys)))
  return newData
}

const filterMonthlyByAssaysPie = (data, props) => {
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
}

// variables that should be removed start
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
        filterFunction: filterMonthlyByAssaysBar,
      },
      {
        id: 'testPerformedMonthlytotal',
        filterFunction: filterMonthlyByAssaysPie,
      },
    ],
  },
]

// variables that should be removed end

const TestsOverTimeGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()

  const [clientSideFilters, setClientSideFilters] = useState(false)
  const [clientSideFilterOptions, setClientSideFilterOptions] = useState(false)

  const updateGraphClientSide = params => setClientSideFilters(params)

  const actionComponent = {
    component: FilterByAssayDropDown,
    props: {
      selectorModifiers,
      data: clientSideFilterOptions,
    },
  }

  const clientSideFilter = {
    identifier: 'assayId',
    isClientSide: true,
    selectorModifiers,
    clientSideFilters,
    clientSideFilterOptions,
    setClientSideFilterOptions,
  }

  return (
    <ErrorBoundary>
      <PermissionsProvider permissions={['dashboard']}>
        <Grid container direction="row" spacing={8}>
          <Grid item xs={12} lg={12}>
            <Grid container>
              <Grid item xs={12}>
                <AspectCard
                  title={formatMessage(graphsContainerMessages.testsOverTimeTitle)}
                  innerSize={9}
                  justify="center"
                  action={params => updateGraphClientSide(params)}
                  actionComponent={actionComponent}
                  name="testsOverTime"
                >
                  <Grid container spacing={8} className={cssClasses('graph__containerGrid')}>
                    <TestsOverTimeGraphMain assaysFromState={assaysFromState} clientSideFilter={clientSideFilter} />
                    <TestsOverTimeGraphSide assaysFromState={assaysFromState} clientSideFilter={clientSideFilter} />
                  </Grid>
                </AspectCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraph
