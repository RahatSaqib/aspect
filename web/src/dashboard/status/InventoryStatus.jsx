import _ from 'lodash'
import _fp from 'lodash/fp'
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
import Card from '@material-ui/core/Card'
import Button from '@material-ui/core/Button'
import MdAssignmentTurnedIn from 'react-icons/lib/md/assignment-turned-in'

import { findKeyInTree } from '../../shared/utils/dom'
import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchInventoryItemDashboard } from '../DashboardRedux'
import { showNewInventoryDialog } from '../../inventory/InventoryRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const getIssueIdsFromSummaryList = (key, summaryList) =>
  _fp.pipe(_fp.flatMap(_fp.prop([key])), _fp.uniq)(summaryList)

function getFillColor({ id, activeSiteIds, issueSiteIds }) {
  if (_.includes(activeSiteIds, id)) {
    return process.env['--aspect-color-mandy']
  }

  if (_.includes(issueSiteIds, id)) {
    return process.env['--aspect-color-supernova']
  }

  return process.env['--aspect-color-mantis']
}

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['inventory:admin', 'inventory:view', 'inventory:edit'],
    features: ['inventoryDashboard'],
  }),
  connect(
    state => ({
      siteList: state.dashboard.inventoryItemSiteList,
      inventoryConsumableSummaryList:
        state.dashboard.inventoryConsumableSummaryList,
    }),
    bindActionCreators.bind(null, {
      fetchInventoryItemDashboard,
      showNewInventoryDialog,
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
      onInventoryClick: (state, { history, showNewInventoryDialog }) => ({
        openDialog = false,
      }) => {
        history.push('/browse/inventory')
        if (openDialog) showNewInventoryDialog()
      },

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
  withProps(({ siteList, activeSiteIds, inventoryConsumableSummaryList }) => {
    const siteStateAbbrs = siteList.map(it => it.get('stateAbbr')).toSet()
    const issueSiteIds = getIssueIdsFromSummaryList(
      'affectedSiteIds',
      inventoryConsumableSummaryList.toJS()
    ).map(id => String(id))

    return {
      fill: ({ properties: { postal } }) =>
        siteStateAbbrs.has(postal) ? '#00c4e0' : '#a4e6f2',
      points: siteList
        .map(it => ({
          id: it.get('name'),
          size: 5,
          siteName: it.get('name'),
          fill: getFillColor({ activeSiteIds, issueSiteIds, id: it.get('id') }),
          latitude: it.get('latitude'),
          longitude: it.get('longitude'),
        }))
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
  inventoryConsumableSummaryList,
  onInventoryClick,
  onSummaryItemClick,
  onMouseEnter,
  onMouseLeave,
  countryIsoAlpha2Code,
}) => (
  <Card className={className}>
    <Title
      title={title}
      icon={<MdAssignmentTurnedIn className={cssClasses('Title__Icon')} />}
    />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints
          countryIsoAlpha2Code={countryIsoAlpha2Code}
          fill={fill}
          points={points}
        />
      </Unit>
      <Unit sm="1-2">
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
            className={cssClasses('Button', 'Button--receive')}
            onClick={() => onInventoryClick({ openDialog: true })}
            variant="contained"
            theme={themes.Button}
          >
            {intl.formatMessage(messages.receiveConsumablesLabel)}
          </Button>
          <Button
            className={cssClasses('Button')}
            onClick={onInventoryClick}
            variant="contained"
          >
            {intl.formatMessage(messages.manageConsumablesLabel)}
          </Button>
        </div>
      </Unit>
    </div>
  </Card>
)

export default enhance(InventoryStatus)
