import _ from 'lodash'
import _fp from 'lodash/fp'
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
import Card from '@material-ui/core/Card'
import { MdDashboard } from 'react-icons/md'

import { findKeyInTree } from '../../shared/utils/dom'
import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchSiteDashboard, fetchDeviceDashboard } from '../DashboardRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const EMPTY_LIST = Immutable.List()

const getIssueIdsFromSummaryMap = (key, summaryMap) =>
  _fp.pipe(
    _fp.values,
    _fp.flatMap(_fp.prop([key])),
    _fp.uniq,
    _fp.filter(id => !_fp.isNil(id))
  )(summaryMap)

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
    permissions: [
      'site:admin',
      'site:view',
      'site:edit',
      'device:admin',
      'device:view',
      'device:edit',
    ],
    features: ['siteDashboard', 'deviceDashboard'],
  }),
  connect(
    state => ({
      siteList: state.dashboard.siteList,
      siteSummaryMap: state.dashboard.siteSummaryMap,
      deviceList: state.dashboard.deviceList,
      deviceSummaryMap: state.dashboard.deviceSummaryMap,
    }),
    bindActionCreators.bind(null, {
      fetchSiteDashboard,
      fetchDeviceDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSiteDashboard()
      this.props.fetchDeviceDashboard()
    },
  }),
  withStateHandlers(
    () => ({
      activeSiteIds: [],
    }),
    {
      onSummaryItemClick: (state, { history }) => (type, event) => {
        const searchParams = new URLSearchParams()
        const filtersParams = new URLSearchParams()
        const ids = `${type}Ids`
        const { target } = event
        filtersParams.set(ids, JSON.parse(findKeyInTree(target, ids)))
        searchParams.set('filters', filtersParams)

        history.push({
          pathname: `/browse/${type}`,
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
  withProps(({ siteList, activeSiteIds, siteSummaryMap, deviceSummaryMap }) => {
    const siteStateAbbrs = siteList.map(it => it.get('stateAbbr')).toSet()
    const issueSiteIdsFromSiteSummaryMap = getIssueIdsFromSummaryMap(
      'siteIds',
      siteSummaryMap.toJS()
    )
    const issueSiteIdsFromDeviceSummaryMap = getIssueIdsFromSummaryMap(
      'siteIds',
      deviceSummaryMap.toJS()
    ).map(id => String(id))

    const issueSiteIds = _.uniq(
      issueSiteIdsFromSiteSummaryMap.concat(issueSiteIdsFromDeviceSummaryMap)
    )

    return {
      fill: ({ properties: { postal } }) =>
        siteStateAbbrs.has(postal) ? '#00c4e0' : '#a4e6f2',
      points: siteList
        .map(it => ({
          id: it.get('name'),
          siteName: it.get('name'),
          size: 5,
          fill: getFillColor({ activeSiteIds, issueSiteIds, id: it.get('id') }),
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
  deviceSummaryMap,
  onMouseEnter,
  onMouseLeave,
  countryIsoAlpha2Code,
}) => {
  const withPersistedEvent = fn => type => event => {
    event.persist()
    fn(type, event)
  }
  const onClick = withPersistedEvent(onSummaryItemClick)
  return (
    <Card className={className}>
      <Title
        title={title}
        icon={<MdDashboard className={cssClasses('Title__Icon')} />}
      />
      <div>
        <Unit sm="1-2" lg="1-4">
          <CountryWithPoints
            countryIsoAlpha2Code={countryIsoAlpha2Code}
            fill={fill}
            points={points}
          />
        </Unit>
        <Unit sm="1-2" lg="1-4">
          <SummaryItemsBlock
            data-device-ids={JSON.stringify(
              deviceSummaryMap
                .getIn(['operational', 'deviceIds'], EMPTY_LIST)
                .map(_.toString)
            )}
            data-site-ids={JSON.stringify(
              deviceSummaryMap.getIn(['operational', 'siteIds'], EMPTY_LIST)
            )}
            onClick={onClick('device')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            intl={intl}
            title={intl.formatMessage(messages.summaryOperationalDevicesTitle)}
            items={deviceSummaryMap
              .getIn(['operational', 'items'], EMPTY_LIST)
              .toJS()}
          />
          <SummaryItemsBlock
            data-site-ids={JSON.stringify(
              siteSummaryMap.getIn(['onlineNow', 'siteIds'], EMPTY_LIST)
            )}
            onClick={onClick('site')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            intl={intl}
            title={intl.formatMessage(messages.summaryOnlineNowTitle)}
            items={siteSummaryMap
              .getIn(['onlineNow', 'items'], EMPTY_LIST)
              .toJS()}
          />
        </Unit>
        <Unit sm="1-2" lg="1-4">
          <SummaryItemsBlock
            data-device-ids={JSON.stringify(
              deviceSummaryMap
                .getIn(['uploadingData', 'deviceIds'], EMPTY_LIST)
                .map(_.toString)
            )}
            data-site-ids={JSON.stringify(
              deviceSummaryMap.getIn(['uploadingData', 'siteIds'], EMPTY_LIST)
            )}
            onClick={onClick('device')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            intl={intl}
            title={intl.formatMessage(messages.summaryUploadingDataTitle)}
            items={deviceSummaryMap
              .getIn(['uploadingData', 'items'], EMPTY_LIST)
              .toJS()}
          />
          <SummaryItemsBlock
            data-site-ids={JSON.stringify(
              siteSummaryMap.getIn(['deviceManagement', 'siteIds'], EMPTY_LIST)
            )}
            onClick={onClick('site')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            intl={intl}
            title={intl.formatMessage(messages.summaryDeviceManagementTitle)}
            items={siteSummaryMap
              .getIn(['deviceManagement', 'items'], EMPTY_LIST)
              .toJS()}
          />
        </Unit>
        <Unit sm="1-2" lg="1-4">
          <SummaryItemsBlock
            data-device-ids={JSON.stringify(
              deviceSummaryMap
                .getIn(['testFailures', 'deviceIds'], EMPTY_LIST)
                .map(_.toString)
            )}
            data-site-ids={JSON.stringify(
              deviceSummaryMap.getIn(['testFailures', 'siteIds'], EMPTY_LIST)
            )}
            onClick={onClick('device')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            intl={intl}
            title={intl.formatMessage(messages.summaryTestFailuresTitle)}
            items={deviceSummaryMap
              .getIn(['testFailures', 'items'], EMPTY_LIST)
              .toJS()}
          />
          <SummaryItemsBlock
            data-site-ids={JSON.stringify(
              siteSummaryMap.getIn(['stockManagement', 'siteIds'], EMPTY_LIST)
            )}
            onClick={onClick('site')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            intl={intl}
            title={intl.formatMessage(messages.summaryStockManagementTitle)}
            items={siteSummaryMap
              .getIn(['stockManagement', 'items'], EMPTY_LIST)
              .toJS()}
          />
        </Unit>
      </div>
    </Card>
  )
}

export default enhance(SiteStatus)
