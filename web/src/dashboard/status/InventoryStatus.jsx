import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  withStateHandlers,
  withProps,
  lifecycle,
  pure,
} from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'

import { findKeyInTree } from '../../shared/utils/dom'
import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchInventoryItemDashboard } from '../DashboardRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import InventorySiteSummaryBar from './InventorySiteSummaryBar'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['inventory:admin', 'inventory:view', 'inventory:edit'],
    features: ['inventoryDashboard'],
  }),
  connect(
    state => ({
      siteList: state.dashboard.inventoryItemSiteList,
      inventorySiteSummaryList: state.dashboard.inventorySiteSummaryList,
      inventoryConsumableSummaryList:
        state.dashboard.inventoryConsumableSummaryList,
    }),
    bindActionCreators.bind(null, {
      fetchInventoryItemDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchInventoryItemDashboard()
    },
  }),
  withStateHandlers(
    () => ({
      activeSiteIds: [],
    }),
    {
      onInventoryClick: (state, { history }) => () =>
        history.push('/browse/inventory'),

      onSummaryItemClick: (state, { history }) => ({ target }) => {
        const searchParams = new URLSearchParams()
        const filtersParams = new URLSearchParams()
        filtersParams.set('consumableId', findKeyInTree(target, 'consumableId'))
        searchParams.set('filters', filtersParams)

        history.push({
          pathname: '/browse/inventory',
          search: searchParams.toString(),
        })
      },

      onMouseEnter: () => ({ target }) => ({
        activeSiteIds: JSON.parse(findKeyInTree(target, 'siteIds')),
      }),
      onMouseLeave: ({ activeSiteIds }) => ({ target }) => ({
        activeSiteIds: _.isEqual(
          JSON.parse(findKeyInTree(target, 'siteIds')),
          activeSiteIds
        )
          ? []
          : activeSiteIds,
      }),
    }
  ),
  withProps(({ siteList, activeSiteIds, inventorySiteSummaryList }) => {
    const siteStateAbbrs = siteList.map(it => it.get('stateAbbr')).toSet()
    const siteById = siteList
      .toKeyedSeq()
      .mapEntries(([, it]) => [it.get('id'), it])

    return {
      fill: ({ properties: { postal } }) =>
        siteStateAbbrs.has(postal) ? '#00c4e0' : '#a4e6f2',
      points: siteList
        .map(it => ({
          id: it.get('name'),
          size: 6,
          fill: _.includes(activeSiteIds, it.get('id')) ? '#EB4D62' : '#73D749',
          latitude: it.get('latitude'),
          longitude: it.get('longitude'),
        }))
        .toJS(),
      inventorySiteSummaryList: inventorySiteSummaryList
        .map(it =>
          it.set('siteName', siteById.getIn([it.get('siteId'), 'name']))
        )
        .toJS(),
    }
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
  fill,
  points,
  inventorySiteSummaryList,
  inventoryConsumableSummaryList,
  onInventoryClick,
  onSummaryItemClick,
  onMouseEnter,
  onMouseLeave,
}) => (
  <Card className={className}>
    <Title
      colorClassName={cssClasses('Title__Color--inventory')}
      title={title}
    />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints
          countryIsoAlpha2Code="US"
          fill={fill}
          points={points}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <InventorySiteSummaryBar data={inventorySiteSummaryList} />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <div
          className={cssClasses('SummaryItemsBlocks--horizontal-scrollable')}
        >
          {inventoryConsumableSummaryList.map(it => (
            <SummaryItemsBlock
              key={it.get('consumableId')}
              data-consumable-id={it.get('consumableId')}
              data-site-ids={JSON.stringify(
                it.get('affectedSiteIds').map(_.toString)
              )}
              onClick={onSummaryItemClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              intl={intl}
              title={it.get('consumableName')}
              items={it.get('data').toJS()}
            />
          ))}
        </div>
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
            className={cssClasses('Button', 'Button--discard')}
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
