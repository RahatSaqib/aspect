/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../../cleanComponents/ErrorBoundary'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import useI18n from '../../../../hooks/useI18n'
import GraphTitle from '../../../../pages/PkDashboard/components/GraphTitle'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const baseConfig = {
  id: 'testPerformedMonthlyPercentage',
  clickThrough: {
    allow: true,
    baseUrl: '/browse/result',
    keys: ['assay', 'indexBy', 'onlyReportableResults', 'displayResult'],
  },
  indexBy: 'month',
  formatDate: 'MMM',
}

const filterFunction = (data, props) => {
  const newData = []
  const keys = ['month']
  map(props, ({ externalId }) => keys.push(externalId))
  map(data, row => newData.push(pick(row, keys)))
  return newData
}

const TestsOverTimeGraphMain = ({ assaysFromState, data, endPointParams, showLabel, filterSelection, title }) => {
  const { formatMessage } = useI18n()
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
    if (grouped && filterSelection) {
      const groupedFiltered = filterFunction(grouped, filterSelection)
      setNewData(groupedFiltered)
    } else {
      setNewData(grouped)
    }
  }, [data, filterSelection])

  return (
    <ErrorBoundary>
      <Grid item xs={12} md={8} lg={8}>
        <div className={cssClasses('Graph_Wrapper')}>
          {graphData && !isEmpty(graphData) ? (
            <>
              {title ? <GraphTitle>{title}</GraphTitle> : null}
              <AspectResponsiveBar
                config={{ ...baseConfig, showLabel, showDecimals: 0, labelTextColor: '#FFF' }}
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
            </>
          ) : (
            <EmptyGraph type="bar" />
          )}
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphMain
