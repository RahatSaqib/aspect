/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../../cleanComponents/ErrorBoundary'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import useI18n from '../../../../hooks/useI18n'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const baseConfig = {
  id: 'tbByCategory1Monthly',
  clickThrough: {
    allow: true,
    assays: ['GxMtbRif', 'GxMtbRifUltra'],
    baseUrl: '/browse/result?filters=',
    baseAssay: 'GxMtbRif',
    keys: ['resultCategoryId', 'indexBy'],
  },
  indexBy: 'month',
  formatDate: 'MMM',
}

const TbDetectedGraphMain = ({ assaysFromState, data, endPointParams, showLabel }) => {
  const { formatMessage } = useI18n()
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  function buildI18nKeys() {
    let i18nKeysCollection = {}
    i18nKeysCollection = reduce(
      data,
      (acc, curr) => {
        acc[curr.resultCategory2] = curr.resultCategory2I18nKey
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
      { resultCategory1: { values: ['Detected'] } },
      'MMM',
      'month',
      'resultCategory2',
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
    setNewData(grouped)
  }, [data])

  return (
    <ErrorBoundary>
      <Grid item xs={12} md={8} lg={8}>
        <div className={cssClasses('Graph_Wrapper')}>
          {graphData && !isEmpty(graphData) ? (
            <AspectResponsiveBar
              assaysFromState={assaysFromState}
              config={{ ...baseConfig, showLabel, showDecimals: 0, labelTextColor: '#333' }}
              data={graphData}
              keys={graphKeys}
              indexBy="month"
              formatDate="MMM"
              tickValuesYShape="none"
              tickValuesXShape="all"
              displayMethod="percentage"
              displayLegend
              type="bar"
              i18nKeys={i18nKeys}
            />
          ) : (
            <EmptyGraph type="bar" />
          )}
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default TbDetectedGraphMain
