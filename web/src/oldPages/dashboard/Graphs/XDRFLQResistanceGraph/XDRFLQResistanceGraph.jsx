import React from 'react'
import FilterByStateDropDown from '../../../../components/AspectDropDown/FilterByStateDropDown'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import BarGraph from '../../../../components/Graphs/BarGraph'
import AxisRightLayer from '../../../../components/Graphs/BarGraph/AxisRightLayer'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import { getTimePeriod } from '../../../../components/Graphs/Helpers/Formatters'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import { FqrToMtbPercentageLine } from './XDRFLQResistanceGraph.Layers'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const xdrPercentageFQRDetectedOverMTBDetected = {
  id: 'xdrPercentageFQRDetectedOverMTBDetectedGraph',
  title: 'xdrPercentageFQRDetectedOverMTBDetectedGraphTitle',
  assays: ['GxMtbXdr'],
  componentSize: 'full',
  group: 'xdr',
  graphRenderPermissions: ['dashboard'],
  graphType: [
    {
      id: 'xdrAssayGraph',
      component: BarGraph,
      type: 'bar-line',
      size: 12,
      componentClasses: [],
      indexBy: 'month', // is used for setting jsx `key` in loops
      fields: [
        { name: 'TotalTests', colorId: 'caseTotal', target: 'bar' },
        {
          name: 'MtbDetected',
          colorId: '--aspect-color-slate',
          target: 'bar',
        },
        { name: 'FqrDetected', colorId: 'caseDetected', target: 'bar' },
        {
          name: 'FqrToMtbPercentage',
          colorId: 'casePercentDetectedOfTotal',
          target: 'line',
        },
      ],
      keyToConsume: '',
      filterBy: {},
      groupMode: 'grouped',
      tickValuesYShape: 'twos',
      tickValuesXShape: 'all',
      isServerSide: true,
      layers: [FqrToMtbPercentageLine, AxisRightLayer],
      axisRightProps: {
        fieldName: 'FqrToMtbPercentage',
      },
      api: {
        endpoint: '/result/xdr-assay-graph',
        params: {
          [MIN_DATE]: '2022-01-01',
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
        isServerSide: true,
      },
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: (value, i18n) => {
        /**
         * 'value' has pattern `yyyy-mm` (i.e. `2022-07`), and to correctly
         * format it to `Jul-22` with taking into account timezones, let's
         * consider mid-month date - so, convert `yyyy-mm` to `yyyy-mm-15`
         */
        return i18n.format(new Date(`${value}-15`), 'MMM-yy')
      },
      clickThrough: false,
    },
  ],
  selectorModifiers: [
    {
      component: FilterByStateDropDown,
      identifier: 'stateId', // for query param name
      isClearable: true,
      isClientSide: true,
      filterFunctions: [
        {
          id: 'xdrAssayGraph',
          shouldFilterOnServer: true,
        },
      ],
    },
  ],
}

const XDRFLQResistanceGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={xdrPercentageFQRDetectedOverMTBDetected.id}>
      <PermissionsProvider permissions={xdrPercentageFQRDetectedOverMTBDetected.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={xdrPercentageFQRDetectedOverMTBDetected} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default XDRFLQResistanceGraph
