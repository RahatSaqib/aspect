import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  withProps,
  lifecycle,
  withStateHandlers,
  pure,
} from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'

import { findKeyInTree } from '../../shared/utils/dom'
import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchSiteDashboard } from '../DashboardRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const EMPTY_LIST = Immutable.List()

const enhance = compose(
  pure,
  requirePermissions({
    features: ['siteDashboard:true'],
  }),
  connect(
    state => ({
      siteList: state.dashboard.siteList,
      siteSummaryMap: state.dashboard.siteSummaryMap,
    }),
    bindActionCreators.bind(null, {
      fetchSiteDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSiteDashboard()
    },
  }),
  withStateHandlers(
    () => ({
      activeSiteIds: [],
    }),
    {
      onSummaryItemClick: (state, { history }) => ({ target }) => {
        const searchParams = new URLSearchParams()
        const filtersParams = new URLSearchParams()
        filtersParams.set(
          'siteIds',
          JSON.parse(findKeyInTree(target, 'siteIds'))
        )
        searchParams.set('filters', filtersParams)

        history.push({
          pathname: '/browse/site',
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
  withProps(({ siteList, activeSiteIds }) => {
    const siteStateAbbrs = siteList.map(it => it.get('stateAbbr')).toSet()

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
    }
  })
)

export const SiteStatus = ({
  intl,
  className,
  title,
  fill,
  points,
  siteSummaryMap,
  onSummaryItemClick,
  onMouseEnter,
  onMouseLeave,
}) => (
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--site')} title={title} />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints
          countryIsoAlpha2Code="US"
          fill={fill}
          points={points}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          data-site-ids={JSON.stringify(
            siteSummaryMap.getIn(['onlineNow', 'siteIds'], EMPTY_LIST)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryOnlineNowTitle)}
          items={siteSummaryMap
            .getIn(['onlineNow', 'items'], EMPTY_LIST)
            .toJS()}
        />
        <SummaryItemsBlock
          data-site-ids={JSON.stringify(
            siteSummaryMap.getIn(['stockManagement', 'siteIds'], EMPTY_LIST)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryStockManagementTitle)}
          items={siteSummaryMap
            .getIn(['stockManagement', 'items'], EMPTY_LIST)
            .toJS()}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          data-site-ids={JSON.stringify(
            siteSummaryMap.getIn(['deviceManagement', 'siteIds'], EMPTY_LIST)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryDeviceManagementTitle)}
          items={siteSummaryMap
            .getIn(['deviceManagement', 'items'], EMPTY_LIST)
            .toJS()}
        />
        <SummaryItemsBlock
          data-site-ids={JSON.stringify(
            siteSummaryMap.getIn(['uploadingData', 'siteIds'], EMPTY_LIST)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryUploadingDataTitle)}
          items={siteSummaryMap
            .getIn(['uploadingData', 'items'], EMPTY_LIST)
            .toJS()}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4" />
    </div>
  </Card>
)

export default enhance(SiteStatus)
