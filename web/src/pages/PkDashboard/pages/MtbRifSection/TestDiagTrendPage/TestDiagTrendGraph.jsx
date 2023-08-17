import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect } from '../../../../../cleanComponents'
import Loading from '../../../../../cleanComponents/Loading'
import AspectResponsiveBar from '../../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import AxisRightLayer from '../../../../../components/Graphs/BarGraph/AxisRightLayer'
import EmptyGraph from '../../../../../components/Graphs/EmptyData'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import {
  lineForPropWithLabel,
  lineForProp,
} from '../../../../../oldPages/dashboard/Graphs/QuartersMtbDetectedGraph/QuartersMtbDetectedGraph.Main.Layers'
import styles from '../../../../../oldPages/dashboard/Graphs/styles.css'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const cssClasses = classnames.bind(styles)

const baseConfig = {
  id: 'tbMtbDetectedQuarterlyTrends',
  groupMode: 'grouped',
  fields: [
    { name: 'Total', colorId: 'caseTotal', target: 'bar' },
    { name: 'MtbDetected', colorId: 'caseDetected', target: 'bar' },
    { name: 'MtbToTotalPercentage', colorId: 'casePercentDetectedOfTotal', target: 'line' },
  ],
  clickThrough: false,
  axisRightProps: { fieldName: 'MtbToTotalPercentage' },
}

const endpointParams = [
  { source: 'tbDetection' },
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(5, 'years', 'yyyy-MM-dd') }, // five years ago
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const TestDiagTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [stateId, setState] = useState()
  const [lgaId, setLga] = useState()
  const { data: assays } = useAssayList()

  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = stateId ? [...endpointParams, { stateId, lgaId }] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbMtbDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/tb-testing-diagnosis-trend', params: mergedParams })
  )

  useEffect(() => {
    if (data) {
      const { grouped, keysFromGrouped, i18nKeys } = data
      setI18nKeys(i18nKeys)
      setGraphData(grouped)
      setGraphKeys(keysFromGrouped)
    }
  }, [data])

  return (
    <PkPage
      title={formatMessage(messages.TbDTestingDiagnosis)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            countryId={user.countryId}
            onChange={e => setState(e.target.value)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            stateId={stateId}
            onChange={e => setLga(e.target.value)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid item xs={12}>
          <div className={cssClasses('Graph_Wrapper')}>
            {graphData && !isEmpty(graphData) && assays ? (
              <AspectResponsiveBar
                assaysFromState={assays}
                config={{
                  ...baseConfig,
                  layers: [
                    showLabel ? lineForPropWithLabel('MtbToTotalPercentage') : lineForProp('MtbToTotalPercentage'),
                    AxisRightLayer,
                  ],
                  showLabel,
                  showDecimals: 0,
                  labelTextColor: '#333',
                }}
                data={graphData}
                keys={graphKeys}
                indexBy="year"
                tickValuesYShape="twos"
                tickValuesXShape="all"
                displayMethod="actual"
                displayLegend
                type="bar-line"
                i18nKeys={i18nKeys}
              />
            ) : (
              <EmptyGraph type="bar" />
            )}
          </div>
        </Grid>
      )}
    </PkPage>
  )
}

export default TestDiagTrendPage
