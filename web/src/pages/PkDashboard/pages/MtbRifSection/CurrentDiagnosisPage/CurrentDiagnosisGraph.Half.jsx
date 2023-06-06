/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../../../cleanComponents/ErrorBoundary'
import EmptyGraph from '../../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../../components/Graphs/intlMessages'
import AspectResponsivePie from '../../../../../components/Graphs/PieGraph/AspectResponsivePie'
import useI18n from '../../../../../hooks/useI18n'
import styles from '../../../../../oldPages/dashboard/Graphs/styles.css'

const cssClasses = classnames.bind(styles)

const filterFunction = (data, props) => {
  const newData = []
  const keys = []
  map(props, ({ externalId }) => keys.push(externalId))
  map(keys, key => {
    const found = filter(data, { id: key })[0]
    if (!isEmpty(found)) {
      return newData.push(found)
    }
  })
  return newData
}

const TestsOverTimeGraphHalf = ({ assaysFromState, data, endPointParams, showLabel, filterSelection }) => {
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
      const groupedFiltered = filterFunction(grouped, filterSelection)
      setNewData(groupedFiltered)
    }
  }, [data, filterSelection])

  return (
    <ErrorBoundary>
      <Grid item xs={12} md={6} lg={6} sx={{ p: 1, mt: 1 }}>
        <div className={cssClasses('Graph_Wrapper')}>
          {graphData && !isEmpty(graphData) ? (
            <AspectResponsivePie
              config={{ id: 'testPerformedMonthlytotal', showLabel, labelTextColor: '#FFF' }}
              assaysFromState={assaysFromState}
              data={graphData}
              keys={graphKeys}
              i18nKeys={i18nKeys}
              displayMethod="percentage"
              componentClasses={['piegraph__container']}
              sideLegend
            />
          ) : (
            <EmptyGraph type="pie" />
          )}
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphHalf
