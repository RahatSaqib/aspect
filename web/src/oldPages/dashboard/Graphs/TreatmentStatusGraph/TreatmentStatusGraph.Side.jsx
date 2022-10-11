/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import isEmpty from 'lodash/isEmpty'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
  prepAssaysForParams,
  prepParamsForEndPoint,
} from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import AspectResponsivePie from '../../../../components/Graphs/PieGraph/AspectResponsivePie'
import useI18n from '../../../../hooks/useI18n'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const params = {
  minDate: startOfMonth(subMonths(new Date(), 12)),
  maxDate: endOfMonth(subMonths(new Date(), 1)),
}

const i18nKeys = { Confirmed: 'Confirmed', NotConfirmed: 'NotConfirmed' }

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
      'MMM yy',
      'monthTested',
      'onTreatment',
      i18nKeysCollection,
      'pieLegacyTreatment',
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
    <Grid item xs={12} md={4} lg={4}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsivePie
            assaysFromState={assaysFromState}
            averages={{
              showTotal: false,
              title: 'treatmentStatusTotalTitle',
              key: ['Confirmed'],
              subTitle: 'treatmentStatusTotalValidTitle',
            }}
            data={graphData}
            displayMethod="percentage"
            componentClasses={['piegraph__container']}
            keys={graphKeys}
            i18nKeys={i18nKeys}
            config={{ id: 'treatmentStatusMonthlyPie', showLabel, labelTextColor: '#333' }}
          />
        ) : null}
      </div>
    </Grid>
  )
}

export default GraphContainer
