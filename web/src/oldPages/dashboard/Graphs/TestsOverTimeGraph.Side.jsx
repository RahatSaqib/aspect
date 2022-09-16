/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../components/ErrorBoundary'
import handleClientSideFilterState from '../../../components/Graphs/GraphRender/ClientSideFilters'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../components/Graphs/Helpers/Formatters'
import messages from '../../../components/Graphs/intlMessages'
import AspectResponsivePie from '../../../components/Graphs/PieGraph/AspectResponsivePie'
import useI18n from '../../../hooks/useI18n'

const TestsOverTimeGraphSide = ({ assaysFromState, clientSideFilter, data, endPointParams, showLabel }) => {
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
      'percentage',
      false,
      'MMM yy',
      'cnt',
      'assay',
      i18nKeysCollection,
      'pie',
      endPointParams,
      formatMessage,
      messages
    )
  }

  function setNewData(grouped) {
    const keysFromGrouped = getGraphKeysFromResults(grouped, 'cnt')
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
      { id: 'testPerformedMonthlytotal', i18nKeys, graphData, assaysFromState },
      { formatRawData, setNewData, setFilterParams }
    )
  }, [clientSideFilter, graphData])

  return (
    <ErrorBoundary>
      <Grid item xs={12} md={4} lg={4}>
        <div style={{ minHeight: '350px', height: '100%' }}>
          {graphData && !isEmpty(graphData) ? (
            <AspectResponsivePie
              config={{ id: 'testPerformedMonthlytotal', showLabel }}
              assaysFromState={assaysFromState}
              data={graphData}
              keys={graphKeys}
              i18nKeys={i18nKeys}
              averages={{
                showTotal: false,
                totalDisplayMethod: 'actual',
                title: 'testsOverTimeAvgTitle',
                key: '*',
                subTitle: null,
              }}
              displayMethod="percentage"
              componentClasses={['piegraph__container']}
            />
          ) : null}
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphSide
