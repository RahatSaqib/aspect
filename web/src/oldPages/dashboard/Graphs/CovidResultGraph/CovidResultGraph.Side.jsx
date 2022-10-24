/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import AspectResponsivePie from '../../../../components/Graphs/PieGraph/AspectResponsivePie'
import useI18n from '../../../../hooks/useI18n'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const CovidResultsGraphSide = ({ assaysFromState, data, endPointParams, showLabel }) => {
  const { formatMessage } = useI18n()
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  function buildI18nKeys() {
    let i18nKeysCollection = {}
    i18nKeysCollection = reduce(
      data,
      (acc, curr) => {
        acc[curr.resultCategory1] = curr.resultCategory1I18nKey
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
      'resultCategory1',
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
    setNewData(grouped)
  }, [data])

  return (
    <ErrorBoundary>
      <Grid item xs={12} md={4} lg={4}>
        <div className={cssClasses('Graph_Wrapper')}>
          {graphData && !isEmpty(graphData) ? (
            <AspectResponsivePie
              config={{ id: 'covidByCategory1Aggregate', showLabel, labelTextColor: '#333' }}
              assaysFromState={assaysFromState}
              data={graphData}
              keys={graphKeys}
              i18nKeys={i18nKeys}
              averages={{
                showTotal: false,
                title: 'clinicalIndicatorsCovidPieLegend',
                key: ['Positive', 'PresumptivePositive'],
                subTitle: 'clinicalIndicatorsPieSubLegend',
              }}
              displayMethod="percentage"
              componentClasses={['piegraph__container']}
            />
          ) : (
            <EmptyGraph type="pie" />
          )}
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default CovidResultsGraphSide
