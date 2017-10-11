import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import { compose, lifecycle, withProps, pure } from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchResultDashboard } from '../DashboardRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import ResultSummaryItemBarStack from './ResultSummaryItemBarStack'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  }),
  connect(
    state => ({
      siteList: state.dashboard.resultSiteList,
      resultSummaryList: state.dashboard.resultSummaryList,
    }),
    bindActionCreators.bind(null, {
      fetchResultDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchResultDashboard()
    },
  }),
  withProps(({ siteList }) => {
    const siteStateAbbrs = siteList.map(it => it.get('stateAbbr')).toSet()

    return {
      fill: ({ properties: { postal } }) =>
        siteStateAbbrs.has(postal) ? '#00c4e0' : '#a4e6f2',
      points: siteList
        .map(it => ({
          id: it.get('name'),
          size: Math.max(3.5, Math.round(it.get('count') / 16)),
          fill: '#73D749',
          latitude: it.get('latitude'),
          longitude: it.get('longitude'),
        }))
        .toJS(),
    }
  })
)

export const ResultStatus = ({
  className,
  title,
  fill,
  points,
  resultSummaryList,
}) => (
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--result')} title={title} />
    <div>
      <Unit md="1-2" lg="1-3">
        <CountryWithPoints
          countryIsoAlpha2Code="US"
          fill={fill}
          points={points}
          onMouseEnterPoint={_.noop}
          onMouseLeavePoint={_.noop}
        />
      </Unit>
      <Unit md="1-2" lg="2-3">
        {resultSummaryList.map(it => (
          <Unit key={it.get('assayTypeName')} sm="1-2" lg="1-3">
            <ResultSummaryItemBarStack item={it} />
          </Unit>
        ))}
      </Unit>
    </div>
  </Card>
)

export default enhance(ResultStatus)
