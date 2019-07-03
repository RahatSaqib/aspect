/* eslint-disable linebreak-style */
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

import IconTitle from 'react-icons/lib/fa/pie-chart'
import IconBarChart from 'react-icons/lib/fa/bar-chart'
import IconArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'
import IconArrowRight from 'react-icons/lib/md/keyboard-arrow-right'
import { ResponsiveBar } from '@nivo/bar'

import { findKeyInTree } from '../../shared/utils/dom'
import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchSiteDashboard, fetchDeviceDashboard } from '../DashboardRedux'
import Title from './Title'
import messages from './messages'
import StyledDropdown from '../../components/shared/StyledDropdown'

const cssClasses = classnames.bind(require('./Status.css'))

// const EMPTY_LIST = Immutable.List()

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

const CustomSymbolShape = ({ size, fill }) => (
  <IconBarChart size={size} color={fill} />
)

const data = [
  { period: 'January', '% Confirmed': 50, '% Unaccountable': 10 },
  { period: 'February', '% Confirmed': 20, '% Unaccountable': 50 },
  { period: 'March', '% Confirmed': 90, '% Unaccountable': 10 },
  { period: 'April', '% Confirmed': 50, '% Unaccountable': 30 },
  { period: 'May', '% Confirmed': 150, '% Unaccountable': 20 },
  { period: 'June', '% Confirmed': 40, '% Unaccountable': 50 },
]
export const TreatmentStatus = ({
  // intl,
  className,
  title,
  // fill,
}) => {
  // const withPersistedEvent = fn => type => event => {
  //   event.persist()
  //   fn(type, event)
  // }
  // const onClick = withPersistedEvent(onItemClick)
  return (
    <Card className={className}>
      {/* <Title
        title={title}
        icon={<MdDashboard className={cssClasses('Title__Icon')} />}
      /> */}
      <div className={cssClasses('TitleContainer')}>
        <Title
          title={title}
          icon={<IconTitle className={cssClasses('Title__Icon')} />}
        />
        <div
          className={cssClasses(
            'FiltersGroup__Child',
            'FiltersGroup__Child--dropdown'
          )}
        >
          <StyledDropdown
            // value={dateRange}
            // source={dateRangeList}
            // onChange={onDateRangeClick}
          />
        </div>
      </div>
      <div style={{ marginTop: 30 }}>
        <Unit sm="1-8" className={cssClasses('Treatment--ArrowLeftContainer')}>
          <IconArrowLeft size={40} color="grey" />
        </Unit>
        <Unit sm="3-4" style={{ height: 320 }}>
          <ResponsiveBar
            data={data}
            keys={['% Confirmed', '% Unaccountable']}
            indexBy="period"
            margin={{ top: 0, right: 0, bottom: 90, left: 0 }}
            padding={0.01}
            innerPadding={1}
            colors={['rgb(65, 174, 118)', 'grey']}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
            }}
            axisLeft={{
              tickValues: 2,
            }}
            enableGridY={false}
            enableLabel={false}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            legends={[
              {
                dataFrom: 'keys',
                // dataFrom: d => {
                //   console.log('____', { d })
                //   return { label: 'aaaaaa', id: '1', color: 'red' }
                // },
                anchor: 'bottom-left',
                direction: 'row',
                justify: false,
                translateX: 5,
                translateY: 80,
                itemsSpacing: 2,
                itemWidth: 200,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1,
                    },
                  },
                ],
                symbolShape: CustomSymbolShape,
                // data: [
                //   { id: 'Confirmed', label: '11111', color: 'cyan' },
                //   { id: 'a2', label: '22221', color: 'red' },
                // ],
              },
            ]}
            animate
            motionStiffness={90}
            motionDamping={15}
          />
        </Unit>
        <Unit sm="1-8" className={cssClasses('Treatment--ArrowRightContainer')}>
          <IconArrowRight size={40} color="grey" />
        </Unit>
      </div>
    </Card>
  )
}

export default enhance(TreatmentStatus)
