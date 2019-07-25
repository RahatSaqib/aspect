/* eslint-disable linebreak-style */
import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import { compose, withProps, lifecycle, withHandlers, pure } from 'recompose'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'

import { addMonths, endOfMonth, format as dateFormat } from 'date-fns'

import IconTitle from 'react-icons/lib/fa/pie-chart'
import IconBarChart from 'react-icons/lib/fa/bar-chart'
import IconArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'
import IconArrowRight from 'react-icons/lib/md/keyboard-arrow-right'
import { ResponsiveBar } from '@nivo/bar'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
import { fetchTreatmentDashboard } from '../DashboardRedux'
import AspectTooltip from '../../components/shared/AspectTooltip'
import Title from './Title'
import messages from './messages'
import StyledDropdown from '../../components/shared/StyledDropdown'

const cssClasses = classnames.bind(require('./Status.css'))

const changePeriod = (props, shift) => {
  const { lastOn, siteId, fetchTreatmentDashboard } = props
  let { endedOn } = props

  const last = Date.parse(`${lastOn}`)
  let finish = endOfMonth(addMonths(Date.parse(`${endedOn}`), shift))
  if (finish > last) {
    finish = last
  }
  endedOn = dateFormat(finish, 'yyyy-MM-dd')
  fetchTreatmentDashboard({ siteId, endedOn })
}
const enhance = compose(
  pure,
  requirePermissions({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
    ],
    features: ['summaryDashboard', 'siteDashboard', 'deviceDashboard'],
  }),
  connect(
    state => {
      const treatmentStatus = state.dashboard.treatmentStatus.toJS()
      return {
        sitesSelectList: state.site.selectList,
        ..._.pick(treatmentStatus, ['siteId', 'endedOn', 'lastOn', 'data']),
      }
    },
    bindActionCreators.bind(null, {
      fetchSitesForSelectList,
      fetchTreatmentDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSitesForSelectList()
      this.props.fetchTreatmentDashboard()
    },
  }),
  withHandlers({
    onChange: ({ endedOn, fetchTreatmentDashboard }) => ({
      target: { value },
    }) => {
      fetchTreatmentDashboard({
        siteId: value || null,
        endedOn,
      })
    },
    onBack: props => () => changePeriod(props, -1),
    onForward: props => () => changePeriod(props, 1),
  }),
  withProps(({ intl, siteId, sitesSelectList, theme }) => ({
    theme,
    isSingleSite:
      sitesSelectList.items.size === 1 && !sitesSelectList.stateName,
    source: sitesSelectList.items
      .map(item => ({
        value: item.get('id'),
        label: item.get('name'),
      }))
      .insert(0, {
        value: '',
        label: intl.formatMessage(messages.treatmentAllSites, {
          region: sitesSelectList.stateName || sitesSelectList.countryName,
        }),
      })
      .toJS(),
    value: sitesSelectList.items
      .find(it => it.get('id') === siteId, null, Immutable.Map())
      .get('id', ''),
  }))
)

export const TreatmentStatus = ({
  intl,
  className,
  title,

  lastOn,
  endedOn,
  data = [],
  isSingleSite,
  source,
  onForward,
  onBack,
  ...restProps
}) => {
  const series = [
    {
      label: 'Confirmed',
      key: 'pcConfirmed',
      color: 'rgb(65, 174, 118)', // green
      colorFade: 'rgba(65, 174, 118, .5)',
    },
    {
      label: 'Not Possible',
      key: 'pcNotPossible',
      color: 'rgb(128, 128, 128)', // grey
      colorFade: 'rgba(128, 128, 128, .5)',
    },
    {
      label: 'Not Confirmed',
      key: 'pcNotConfirmed', // calculated value, see reducer for case RECEIVE_TREATMENT_DASHBOARD
      color: 'rgb(244, 117, 96)', // red
      colorFade: 'rgba(244, 117, 96, .5)',
    },
  ]
  const tickSeparatorX = `-${50 / data.length}%`

  lastOn = dateFormat(lastOn, 'yyyy-MM')

  return (
    <Card className={className}>
      <div
        className={cssClasses('TitleContainer', 'Treatment--TitleContainer')}
      >
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
          {source.length > 1 &&
            (isSingleSite ? (
              <div className={cssClasses('SiteDropdown__Label')}>
                {source[1].label}
              </div>
            ) : (
              <StyledDropdown displayEmpty source={source} {...restProps} />
            ))}
        </div>
        <Unit sm="1-8" />
      </div>

      <div style={{ marginTop: 30 }}>
        <Unit
          sm="1-8"
          className={cssClasses(
            'Treatment--arrow-container',
            'Treatment--ArrowLeftContainer'
          )}
        >
          <IconArrowLeft size={40} color="grey" onClick={onBack} />
        </Unit>
        <Unit sm="3-4" style={{ height: 320 }}>
          <div style={{ height: 260 }}>
            <ResponsiveBar
              data={data}
              keys={series.map(x => x.key)}
              indexBy="period"
              margin={{ top: 0, right: 0, bottom: 50, left: 0 }}
              padding={0.01} // between stacks, (ratio)
              innerPadding={1} // between bars in a stack, (px)
              colors={bar =>
                series.find(x => x.key === bar.id)[
                  bar.data.monthTested === lastOn ? 'colorFade' : 'color'
                ]
              }
              axisBottom={{
                tickSize: 0,
                tickPadding: 10,
                tickRotation: 0,
                renderTick: tick => (
                  <g
                    key={tick.key}
                    transform={`translate(${tick.x},${tick.y + 20})`}
                  >
                    {tick.tickIndex > 0 && (
                      <line
                        stroke="#b7b7be"
                        strokeWidth={1}
                        y1={-20}
                        y2={15}
                        x1={tickSeparatorX}
                        x2={tickSeparatorX}
                      />
                    )}
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fill: '#333',
                        fontSize: 14,
                      }}
                    >
                      {tick.value}
                    </text>
                    {data[tick.tickIndex] &&
                      data[tick.tickIndex].monthTested === lastOn && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          y="20"
                          style={{
                            fill: '#666',
                            fontSize: 11,
                          }}
                        >
                          <tspan style={{ fill: 'red' }}>* </tspan>
                          {intl.formatMessage(
                            messages.treatmentGraphNotCompleteData
                          )}
                        </text>
                      )}
                  </g>
                ),
              }}
              axisLeft={{
                tickValues: 2,
              }}
              enableGridY={false}
              enableLabel={false}
              animate
              maxValue={100}
              motionStiffness={90}
              motionDamping={15}
              tooltip={({ color, data, id, indexValue, value }) => (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      className={cssClasses('Treatment--graph-tooltip-color')}
                      style={{ backgroundColor: color }}
                    />
                    {`% ${series.find(x => x.key === id).label} `}
                  </div>
                  <div>
                    {`${indexValue}: `}
                    <strong>{value}</strong>% ({data[`cnt${id.substr(2)}`]}{' '}
                    results)
                  </div>
                </div>
              )}
              theme={{
                tooltip: {
                  container: {
                    background: '#ffffcc',
                    border: '1px solid #555',
                  },
                },
              }}
            />
          </div>
          <div className={cssClasses('Treatment--graph-legend')}>
            {series.map(({ label, key, color }) => (
              <div className={cssClasses('Treatment--graph-legend-item')}>
                <IconBarChart size={20} color={color} />
                <span
                  className={cssClasses('Treatment--graph-legend-item-text')}
                >
                  {label}
                </span>
                <AspectTooltip
                  showHelpIcon
                  className={cssClasses('Treatment--graph-tooltip-help-icon')}
                  title={intl.formatMessage(
                    messages[`treatmentTooltipFor_${key}`]
                  )}
                />
              </div>
            ))}
          </div>
        </Unit>
        <Unit
          sm="1-8"
          className={cssClasses(
            'Treatment--arrow-container',
            'Treatment--ArrowRightContainer'
          )}
        >
          {endedOn < lastOn && (
            <IconArrowRight size={40} color="grey" onClick={onForward} />
          )}
        </Unit>
      </div>
    </Card>
  )
}

export default enhance(TreatmentStatus)
