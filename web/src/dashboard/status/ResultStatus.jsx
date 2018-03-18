import _ from 'lodash'
import { scaleLinear } from 'd3-scale'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import { compose, lifecycle, withProps, pure } from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'
import { scaleOrdinal } from '@vx/scale'
import { LegendOrdinal } from '@vx/legend'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchResultDashboard } from '../DashboardRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import ResultSummaryItemBarStack, {
  colorByResultCategoryExternalId,
} from './ResultSummaryItemBarStack'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['resultDashboard:admin', 'resultDashboard:view'],
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
  withProps(({ siteList, resultSummaryList }) => {
    const siteStateAbbrs = siteList.map(it => it.get('stateAbbr')).toSet()
    const siteById = siteList
      .toKeyedSeq()
      .mapEntries(([, it]) => [it.get('id'), it])
    const domain = _.keys(colorByResultCategoryExternalId)

    const scale = scaleLinear()
      .domain(
        siteList.reduce(
          (acc, it) => [
            Math.min(acc[0], it.get('count')),
            Math.max(acc[1], it.get('count')),
          ],
          [Infinity, -Infinity]
        )
      )
      .range([3, 7])

    return {
      fill: ({ properties: { postal } }) =>
        siteStateAbbrs.has(postal) ? '#00c4e0' : '#a4e6f2',
      points: siteList
        .map(it => ({
          id: it.get('name'),
          size: scale(it.get('count')),
          fill: '#73D749',
          latitude: it.get('latitude'),
          longitude: it.get('longitude'),
        }))
        .toJS(),
      domain,
      zScale: scaleOrdinal({
        domain,
        range: _.values(colorByResultCategoryExternalId),
      }),
      resultSummaryList: resultSummaryList
        .map(item =>
          item.set(
            'data',
            item
              .get('data')
              .map(it =>
                it.set('siteName', siteById.getIn([it.get('siteId'), 'name']))
              )
          )
        )
        .toJS(),
    }
  })
)

export const ResultStatus = ({
  className,
  title,
  fill,
  points,
  domain,
  zScale,
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <LegendOrdinal
            domain={domain}
            scale={zScale}
            labelTransform={_.constant((datum, index) => ({
              datum,
              index,
              text: datum,
              value: zScale(datum),
            }))}
            direction="column"
            labelMargin="0 15px 0 0"
          />
        </div>
      </Unit>
      <Unit md="1-2" lg="2-3">
        {resultSummaryList.map(item => (
          <Unit key={item.assayTypeName} sm="1-2" lg="1-3">
            <ResultSummaryItemBarStack item={item} />
          </Unit>
        ))}
      </Unit>
    </div>
  </Card>
)

export default enhance(ResultStatus)
