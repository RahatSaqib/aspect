import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'

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
    data: data.map(list => list.map((map, i) => map.set('key', i))).toJS(),
  })),
  withHandlers({
    onInventoryClick: ({ history }) => () => history.push('/browse/inventory'),
  }),
  requirePermissions({
    permissions: ['inventory:admin', 'inventory:view', 'inventory:edit'],
  })
)

const themes = {
  Button: {
    neutral: cssClasses('Button--receive'),
    raised: cssClasses('Button--raised'),
  },
}

export const InventoryStatus = ({
  intl,
  className,
  title,
  data,
  onInventoryClick,
}) => (
  <Card className={className}>
    <Title
      colorClassName={cssClasses('Title__Color--inventory')}
      title={title}
    />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints countryIsoAlpha2Code="TZ" />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryMedicoTBTitle)}
          items={data.TB}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          intl={intl}
          title={intl.formatMessage(messages.summaryHealthPlusHIVTBTitle)}
          items={data.HIV}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <div className={cssClasses('ButtonsBlock')}>
          <Button
            className={cssClasses('Button')}
            label={intl.formatMessage(messages.receiveConsumablesLabel)}
            onClick={onInventoryClick}
            raised
            theme={themes.Button}
          />
          <Button
            className={cssClasses('Button')}
            label={intl.formatMessage(messages.discardConsumablesLabel)}
            onClick={onInventoryClick}
            raised
            theme={themes.Button}
          />
          <Button
            className={cssClasses('Button')}
            label={intl.formatMessage(messages.manageConsumablesLabel)}
            onClick={onInventoryClick}
            raised
          />
        </div>
      </Unit>
    </div>
  </Card>
)

export default enhance(InventoryStatus)
