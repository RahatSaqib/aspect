/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../components/ErrorBoundary'
import AspectResponsiveBar from '../../../components/Graphs/BarGraph/AspectResponsiveBar'
import handleClientSideFilterState from '../../../components/Graphs/GraphRender/ClientSideFilters'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../components/Graphs/Helpers/Formatters'
import messages from '../../../components/Graphs/intlMessages'
import useI18n from '../../../hooks/useI18n'

const baseConfig = {
  id: 'testPerformedMonthlyPercentage',
  clickThrough: {
    allow: true,
    baseUrl: '/browse/result?filters=',
    keys: ['assay', 'indexBy'],
  },
  indexBy: 'month',
  formatDate: 'MMM',
}

const TestsOverTimeGraphMain = ({ assaysFromState, clientSideFilter, data, endPointParams, showLabel }) => {
  const { formatMessage } = useI18n()
  const [, setFilterParams] = useState([])
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  function buildI18nKeys() {
    let i18nKeysCollection = {}
    i18nKeysCollection = reduce(
      data,
      (acc, curr) => {
        acc[curr.assay] = curr.assayI18nKey
        return acc
      },
      {}
    )
    setI18nKeys(i18nKeysCollection)
    return i18nKeysCollection
  }

  function formatRawData() {
    const i18nKeysCollection = buildI18nKeys()

    return formatDataByGraphType(
      data,
      'actual',
      false,
      'MMM',
      'month',
      'assay',
      i18nKeysCollection,
      'bar',
      endPointParams,
      formatMessage,
      messages
    )
  }

  function setNewData(grouped) {
    const keysFromGrouped = getGraphKeysFromResults(grouped, 'month')
    setGraphData(grouped)
    setGraphKeys(keysFromGrouped)
  }

  useEffect(() => {
    const grouped = formatRawData()
    if (grouped) {
      setNewData(grouped)
    }
  }, [data])

  useEffect(() => {
    return handleClientSideFilterState(
      clientSideFilter,
      { id: 'testPerformedMonthlyPercentage', i18nKeys, graphData, assaysFromState },
      { formatRawData, setNewData, setFilterParams }
    )
  }, [clientSideFilter, graphData])

  return (
    <ErrorBoundary>
      <Grid item xs={12} md={8} lg={8}>
        <div style={{ minHeight: '350px', height: '100%' }}>
          {graphData && !isEmpty(graphData) ? (
            <AspectResponsiveBar
              config={{ ...baseConfig, showLabel }}
              assaysFromState={assaysFromState}
              data={graphData}
              keys={graphKeys}
              i18nKeys={i18nKeys}
              indexBy="month"
              formatDate="MMM"
              tickValuesYShape="none"
              tickValuesXShape="all"
              displayMethod="actual"
              displayLegend
              type="bar"
            />
          ) : null}
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphMain
