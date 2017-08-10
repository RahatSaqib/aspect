import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, pure } from 'recompose'
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import Title from './Title'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  withProps(({ data }) => ({
    data: data.map((map, i) => Immutable.List.of(map.set('key', i))).toJS(),
  })),
  requirePermissions({
    permissions: ['site:admin', 'site:view', 'site:edit'],
  })
)

export const SiteStatus = ({ intl, className, title, data }) =>
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--site')} title={title} />
    <div>
      <Unit sm="1-2" lg="1-4">
        <img
          src={require('./placeholder-map.png')}
          alt="placeholder"
          style={{ width: '100%' }}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryOnlineNowTitle)}
          items={data.onlineNow}
        />
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryStockManagementTitle)}
          items={data.stockManagement}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryServicingTitle)}
          items={data.servicing}
        />
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryUploadingDataTitle)}
          items={data.uploadingData}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryTestQualityTitle)}
          items={data.testQuality}
        />
      </Unit>
    </div>
  </Card>

export default enhance(SiteStatus)
