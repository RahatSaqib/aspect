import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withStateHandlers, pure } from 'recompose'
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import ChartContainer from '../../components/graph/ChartContainer'
import BarChart from '../../components/graph/BarChart'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  }),
  withStateHandlers(
    {
      points: [
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1635',
          lat: -14.2064,
          lng: 34.1833,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1636',
          lat: -13.625,
          lng: 33.8651,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1637',
          lat: -14.0415,
          lng: 33.7683,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1638',
          lat: -14.374,
          lng: 35.3501,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1639',
          lat: -13.696,
          lng: 33.0113,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1640',
          lat: -14.7843,
          lng: 34.6861,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1641',
          lat: -13.2659,
          lng: 33.8763,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1642',
          lat: -13.7572,
          lng: 34.4903,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1628',
          lat: -17.0479,
          lng: 35.1003,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1647',
          lat: -15.4526,
          lng: 35.4256,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1648',
          lat: -15.6875,
          lng: 34.9413,
        },
        {
          count: _.random(16),
          status: ['ok', 'warning', 'error'][_.random(2)],
          id: '1649',
          lat: -15.6394,
          lng: 34.5126,
        },
      ] // First, given the data from API (mocked here for now)
        .map((
          it // Then, we can determine how to display it (size, fill, ……)
        ) => ({
          ...it,
          size: Math.max(4, Math.round(it.count / 2.5)),
          fill: {
            ok: '#73D749',
            warning: '#FCB425',
            error: '#E75164',
          }[it.status],
        })),
    },
    {
      onMouseEnterPoint: ({ points }) => pointId => ({
        points: points.map(it => {
          if (it.id === pointId) {
            return {
              ...it,
              size: 12, // onHover, scale it up
            }
          }
          return it
        }),
      }),
      onMouseLeavePoint: ({ points }) => pointId => ({
        points: points.map(it => {
          if (it.id === pointId) {
            return {
              ...it,
              size: Math.max(4, Math.round(it.count / 2.5)), // onBlur, scale it back to normal
            }
          }
          return it
        }),
      }),
    }
  )
)

export const ResultStatus = ({
  intl,
  className,
  title,
  points,
  onMouseEnterPoint,
  onMouseLeavePoint,
  data,
}) =>
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--result')} title={title} />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints
          countryIsoAlpha2Code="MW"
          points={points}
          onMouseEnterPoint={onMouseEnterPoint}
          onMouseLeavePoint={onMouseLeavePoint}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <ChartContainer
          className={cssClasses('ChartContainer')}
          title={intl.formatMessage(messages.summaryTBTitle)}
        >
          <BarChart
            data={data.toJS()}
            color={['#27c4e0', '#e85065']}
            spacing={0.3}
            numLabelSize={30}
          />
        </ChartContainer>
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <ChartContainer
          className={cssClasses('ChartContainer')}
          title={intl.formatMessage(messages.summaryHIVTitle)}
        >
          <BarChart
            data={data.toJS()}
            color={['#27c4e0', '#e85065']}
            spacing={0.3}
            numLabelSize={30}
          />
        </ChartContainer>
      </Unit>
    </div>
  </Card>

export default enhance(ResultStatus)
