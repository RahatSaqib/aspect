import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, pure } from 'recompose'
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  withProps(({ data }) => ({
    data: data.map((map, i) => Immutable.List.of(map.set('key', i))).toJS(),
  })),
  requirePermissions({
    permissions: ['device:admin', 'device:view', 'device:edit'],
  })
)

export const DeviceStatus = ({ intl, className, title, data }) => (
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--device')} title={title} />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints countryIsoAlpha2Code="US" />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryOperationalDevicesTitle)}
          items={data.operational}
        />
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryQualityControlTitle)}
          items={data.qualityControl}
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
          title={intl.formatMessage(messages.summaryCalibrationTitle)}
          items={data.calibration}
        />
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryTestFailuresTitle)}
          items={data.testFailures}
        />
      </Unit>
    </div>
  </Card>
)

export default enhance(DeviceStatus)
