import classnames from 'classnames/bind'
import React from 'react'
import { compose, pure } from 'recompose'
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import ChartContainer from '../../components/graph/ChartContainer'
import BarChart from '../../components/graph/BarChart'
import Title from './Title'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  })
)

export const ResultStatus = ({ intl, className, title, data }) =>
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--result')} title={title} />
    <div>
      <Unit sm="1-2" lg="1-4">
        <img
          src={require('./placeholder-map.png')}
          alt="placeholder"
          style={{ width: '100%' }}
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
