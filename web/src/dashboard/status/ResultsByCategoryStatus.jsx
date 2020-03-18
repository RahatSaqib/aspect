/* eslint-disable linebreak-style */
import pick from 'lodash/pick'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  withProps,
  lifecycle,
  withHandlers,
  pure,
  withState,
} from 'recompose'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'
import { FaChartBar as IconTitle } from 'react-icons/fa'
import NivoPieGraph from '../../components/graph/NivoPieGraph'
import NivoBarGraph from '../../components/graph/NivoBarGraph'

import requirePermissions from '../../components/shared/requirePermissions'
import { fetchResultsByCategoryDashboard } from '../DashboardRedux'
import Title from './Title'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
    ],
    features: ['summaryDashboard', 'siteDashboard', 'deviceDashboard'],
  }),
  connect(
    state => {
      const resultsByCategory = state.dashboard.resultsByCategory.toJS()
      return {
        data: resultsByCategory,
      }
    },
    bindActionCreators.bind(null, {
      fetchResultsByCategoryDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchResultsByCategoryDashboard({
        assay: this.props.assayTypeId,
        minDate: '2019-10-01',
        type: 'aggregate',
      })
      this.props.fetchResultsByCategoryDashboard({
        assay: this.props.assayTypeId,
        minDate: '2019-10-01',
        groupBy: ['month', 'resultCategory1'],
        type: 'byMonth',
      })
    },
  })
)

const groupByKey = (data, key, cntKey) => {
  return data.reduce((acc, curr) => {
    acc[curr[key]] = {
      ...acc[curr[key]],
      [key]: curr[key],
      [curr[cntKey]]: curr.cnt,
    }
    return acc
  }, {})
}

const normaliseKeys = data => {
  const normalised = []
  for (const [key, value] of Object.entries(data)) {
    normalised.push({ ...value })
  }
  return normalised
}

export const ResultsByCategoryStatus = ({
  intl,
  className,
  title,
  assayTypeId,
  data = [],
  keys,
}) => {
  if (data[assayTypeId]) {
    let monthData
    const { byMonth, aggregate } = data[assayTypeId]
    const aggregateData = aggregate && aggregate.data

    if (byMonth && byMonth.data) {
      const grouped = groupByKey(byMonth.data, 'month', 'resultCategory1')
      monthData = normaliseKeys(grouped)
    }

    console.log(monthData, aggregateData)

    return (
      <Card className={className}>
        <div
          className={cssClasses('TitleContainer', 'Treatment--TitleContainer')}
        >
          <Title
            title={title}
            icon={<IconTitle className={cssClasses('Title__Icon')} />}
          />
        </div>

        <div style={{ marginTop: 30 }}>
          <div className={cssClasses('results--container')}>
            <div className={cssClasses('results--graphContainer')}>
              <div className={cssClasses('resultsContainer--byMonth')}>
                <NivoBarGraph data={monthData} keys={keys} />
              </div>
              <div className={cssClasses('resultsContainer--aggregate')}>
                <NivoPieGraph data={aggregateData} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }
  return <div>Loading...</div>
}

export default enhance(ResultsByCategoryStatus)
