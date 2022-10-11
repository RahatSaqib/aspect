/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import isEmpty from 'lodash/isEmpty'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
  prepAssaysForParams,
  prepParamsForEndPoint,
} from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import useI18n from '../../../../hooks/useI18n'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const params = {
  minDate: startOfMonth(subMonths(new Date(), 12)),
  maxDate: endOfMonth(subMonths(new Date(), 1)),
}

const i18nKeys = { Confirmed: 'Confirmed', NotConfirmed: 'NotConfirmed' }

const baseConfig = {
  id: 'treatmentStatusMonthly',
  clickThrough: {
    allow: true,
    baseUrl: '/browse/result?filters=',
    keys: ['treatmentStatus', 'indexBy'],
  },
  indexBy: 'monthTested',
  formatDate: 'MMM',
}

const GraphContainer = ({ assaysFromState, whiteListed, rawData, showLabel }) => {
  const { formatMessage } = useI18n()
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = [...prepAssaysForParams(whiteListed, 'GET'), ...prepParamsForEndPoint(params, false)]

  function formatRawData() {
    const i18nKeysCollection = i18nKeys

    return formatDataByGraphType(
      rawData,
      'percentage',
      false,
      'MMM',
      'monthTested',
      'pcOnTreatment',
      i18nKeysCollection,
      'barLegacyTreatment',
      mergedParams,
      formatMessage,
      messages
    )
  }

  function setNewData(grouped) {
    const keysFromGrouped = getGraphKeysFromResults(grouped, 'monthTested')
    setGraphData(grouped)
    setGraphKeys(keysFromGrouped)
  }

  useEffect(() => {
    const grouped = formatRawData()
    if (grouped) {
      setNewData(grouped)
    }
  }, [rawData])

  return (
    <Grid item xs={12} md={8} lg={8}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsiveBar
            assaysFromState={assaysFromState}
            config={{ ...baseConfig, showLabel, showDecimals: 0, labelTextColor: '#333' }}
            data={graphData}
            keys={graphKeys}
            indexBy="monthTested"
            formatDate="MMM"
            tickValuesYShape="none"
            tickValuesXShape="all"
            displayMethod="percentage"
            displayLegend
            type="barLegacyTreatment"
            i18nKeys={i18nKeys}
          />
        ) : null}
      </div>
    </Grid>
  )
}

export default GraphContainer
