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
import BarGraph from '../../../components/Graphs/BarGraph'
import GraphRender from '../../../components/Graphs/GraphRender'
import graphsContainerMessages from '../../../components/Graphs/GraphsContainer/messages'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import PieGraph from '../../../components/Graphs/PieGraph'
import useI18n from '../../../hooks/useI18n'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'
import GraphContainerStyles from './GraphsContainer.css'

const cssClasses = classnames.bind(GraphContainerStyles)

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

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

const mainGraph = {
  id: 'testPerformedMonthlyPercentage',
  component: BarGraph,
  type: 'bar',
  size: 8,
  componentClasses: ['BARCLASS'],
  api: {
    endpoint: '/result/clinical-indicator-aggregations',
    params: {
      groupBy: ['month', 'assay'],
      [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
  },
  i18nKey: 'assayI18nKey',
  indexBy: 'month',
  keyToConsume: 'assay',
  tickValuesYShape: 'none',
  tickValuesXShape: 'all',
  displayMethod: 'actual',
  displayLegend: true,
  formatDate: 'MMM',
  clickThrough: {
    allow: true,
    baseUrl: '/browse/result?filters=',
    keys: ['assay', 'indexBy'],
  },
}

const sideGraph = {
  id: 'testPerformedMonthlytotal',
  component: PieGraph,
  type: 'pie',
  size: 4,
  componentClasses: ['piegraph__container'],
  api: {
    endpoint: '/result/clinical-indicator-aggregations',
    params: {
      groupBy: ['month', 'assay'],
      [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
  },
  i18nKey: 'assayI18nKey',
  indexBy: 'cnt',
  keyToConsume: 'assay',
  displayMethod: 'percentage',
  formatDate: 'MMM yy',
  averages: {
    showTotal: false,
    totalDisplayMethod: 'actual',
    title: 'testsOverTimeAvgTitle',
    key: '*',
    subTitle: null,
  },
}
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
                    <GraphRender
                      assays={{ whiteListed: [], assaysFromState }}
                      config={mainGraph}
                      key={mainGraph.id}
                      id={mainGraph.id}
                      updatedParams={false}
                      formatMessage={formatMessage}
                      clientSideFilter={clientSideFilter}
                      isOwnerReady
                    />
                    <GraphRender
                      assays={{ whiteListed: [], assaysFromState }}
                      config={sideGraph}
                      key={sideGraph.id}
                      id={sideGraph.id}
                      updatedParams={false}
                      formatMessage={formatMessage}
                      clientSideFilter={clientSideFilter}
                      isOwnerReady
                    />
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
