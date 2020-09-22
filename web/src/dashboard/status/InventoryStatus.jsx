import _fp from 'lodash/fp'
import includes from 'lodash/includes'
import isEqual from 'lodash/isEqual'
import toString from 'lodash/toString'
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
import { MdAssignmentTurnedIn } from 'react-icons/md'

import findKeyInTree from '../../shared/utils/dom'
import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchInventoryItemDashboard } from '../DashboardRedux'
import { showNewInventoryDialog } from '../../inventory/InventoryRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import SummaryItemsBlock from './SummaryItemsBlock'
import InventoryItems from './InventoryItems'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const {
  '--aspect-color-mandy': colorMandy,
  '--aspect-color-supernova': colorSupernova,
  '--aspect-color-mantis': colorMantis,
} = process.env

const getIssueIdsFromSummaryList = (key, summaryList) =>
  _fp.pipe(_fp.flatMap(_fp.prop([key])), _fp.uniq)(summaryList)

function getFillColor({ id, activeSiteIds, issueSiteIds }) {
  if (includes(activeSiteIds, id)) {
    return colorMandy
  }

  if (includes(issueSiteIds, id)) {
    return colorSupernova
  }

  return colorMantis
}

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['dashboard:inventory', 'inventory:view'],
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
        activeSiteIds: isEqual(
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

    const {
      '--aspect-color-scooter-blue-1': colorScooterBlue1,
      '--aspect-color-scooter-blue-4': colorScooterBlue4,
    } = process.env

    return {
      fill: ({ properties: { postal } }) =>
        siteStateAbbrs.has(postal) ? colorScooterBlue1 : colorScooterBlue4,
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
  history,
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
    {/* <div>
      {countryIsoAlpha2Code && (
        <Unit sm="1-2" lg="1-4">
          <CountryWithPoints
            countryIsoAlpha2Code={countryIsoAlpha2Code}
            fill={fill}
            points={points}
          />
        </Unit>
      )}
      <Unit sm={countryIsoAlpha2Code ? '1-2' : '3-4'}>
        <div
          className={cssClasses('SummaryItemsBlocks--horizontal-scrollable')}
        >
          {inventoryConsumableSummaryList.map(it => (
            <SummaryItemsBlock
              key={it.get('consumableId')}
              data-consumable-id={it.get('consumableId')}
              data-site-ids={JSON.stringify(
                it.get('affectedSiteIds').map(toString)
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
      <Unit sm={countryIsoAlpha2Code ? '1-2' : '1-4'} lg="1-4">
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
    </div> */}
    {/* <InventoryItems
      intl={intl}
      history={history}
      className={cssClasses('Section--withDropdown')}
    /> */}
  </Card>
)

export default enhance(InventoryStatus)
