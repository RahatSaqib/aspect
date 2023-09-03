/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import ErrorBoundary from '../../../../../cleanComponents/ErrorBoundary'
import EmptyGraph from '../../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../../components/Graphs/intlMessages'
import AspectResponsivePie from '../../../../../components/Graphs/PieGraph/AspectResponsivePie'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages } from '../../../../../messages'
import styles from '../../../../../oldPages/dashboard/Graphs/styles.css'

const cssClasses = classnames.bind(styles)

const TestsOverTimeGraphHalf = ({ assaysFromState, data, endPointParams, showLabel }) => {
  const { formatMessage } = useI18n()
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)
  const [showPercentage, setShowPercentage] = useState()

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
      showPercentage ? 'percentage' : 'actual',
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
      <Grid item xs={12}>
        <div className={cssClasses('Graph_Wrapper')}>
          {graphData && !isEmpty(graphData) ? (
            <AspectResponsivePie
              config={{ id: 'testPerformedMonthlytotal', showLabel, labelTextColor: '#333' }}
              assaysFromState={assaysFromState}
              data={graphData}
              keys={graphKeys}
              i18nKeys={i18nKeys}
              displayMethod={showPercentage ? 'percentage' : 'actual'}
              componentClasses={['piegraph__container']}
              sideLegend
            />
          ) : (
            <EmptyGraph type="pie" />
          )}
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showPercentage)}
            control={<Switch checked={showPercentage} onChange={e => setShowPercentage(e.target.checked)} />}
          />
        </div>
      </Grid>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphHalf
