import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { subMonths, startOfMonth, format } from 'date-fns'

import BarGraph from './Graphs/BarGraph'
import PieGraph from './Graphs/PieGraph'

import ClinicalIndicatorsContainer from './ClinicalIndicatorsContainer'

import messages from './messages'

const cssClassesStatus = classnames.bind(require('../Status.css'))

export const ClinicalIndicators = ({ intl, assays: assaysFromState }) => {
  const [assays, setAssays] = useState(false)
  const [months] = useState(5)

  useEffect(() => {
    if (!assays) {
      const minDate = format(
        startOfMonth(subMonths(new Date(), months)),
        'yyyy-MM-dd'
      )

      /**
       * setAssays: array with config params to drive graph generation.
       * @param  {String} id The assay ID to pass to the endpoint
       * @param  {String} name Name of the disease to show
       * @param  {String} graphContainerClass Class to apply to container component
       * @param  {Array} colors colors per data point, order is important!
       * @param  {Array} orderBy Order of datapoints within the graph, order is important!
       * @param  {Array} graphType Array of grouped graphs to generate. Order matters.
       *    @param  {String} dataKey Key to match state tree in Redux
       *    @param  {Function} component Graph component to render, passed from imports
       *    @param  {String [n='percentage']} displayMethod Accepts 'percentage': consistent height and
       *         - split by percentage and 'actual': shows actual count split (Bargraph only)
       *    @param  {String} componentClass Class you wish to apply to downstream graph
       *    @param  {String} indexBy Key in state to use as index for the graph
       *    @param  {String} resultCategory Key to match naming convention from endpoint
       *    @param  {Array} groupBy Keys to pass to endopoint for data retrieval
       *    @param  {Bool} legend Bool to show/hide graph legend (Currently Bar only)
       *    @param  {Object} averages Show/hide average message in Pie charts
       *       @param  {String} title Title of averages message
       *       @param  {String} key Key to use as count/sum for averages
       * @return {Array} Passed to ClinicalIndicatorsContainer will generate the UI
       */

      const barGraphType = {
        dataKey: 'byMonth',
        component: BarGraph,
        displayMethod: 'percentage',
        componentClass: 'clinicalIndicators__bar',
        indexBy: 'month',
        resultCategory: 'resultCategory1',
        groupBy: ['month', 'resultCategory1'],
        legend: true,
        formatDate: intl.formatMessage(messages.clinicalIndicators.dateFormat),
        minDate,
      }

      const pieGraphType = {
        dataKey: 'aggregate',
        component: PieGraph,
        componentClass: 'clinicalIndicators__pie',
        indexBy: 'cnt',
        resultCategory: 'resultCategory1',
        groupBy: ['resultCategory1'],
        legend: false,
        averages: {
          title: intl.formatMessage(messages.clinicalIndicators.HIV.pie.legend),
        },
        minDate,
      }

      const buildAssays = []

      assaysFromState.map(assay => {
        const { externalId, name } = assay
        return buildAssays.push({
          id: externalId,
          name,
          graphContainerClass: 'clinicalIndicator__graphs',
          colors: ['#D60000', '#FFC9C4', '#00CA1C'],
          orderBy: ['MoreThan1000', 'LessThan1000', 'NotDetected'],
          graphType: [barGraphType, pieGraphType],
          assayFromState: assay,
        })
      })

      setAssays(buildAssays)
    }
  }, [assays, assaysFromState, intl, months])

  return assays
    ? assays.map(assay => {
        const { name } = assay
        const title = intl.formatMessage(messages.clinicalIndicators.HIV.title)
        return (
          <ClinicalIndicatorsContainer
            title={name}
            className={cssClassesStatus('Section--withStatus')}
            assay={assay}
          />
        )
      })
    : null
}

export default ClinicalIndicators
