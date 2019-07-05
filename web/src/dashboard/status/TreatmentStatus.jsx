/* eslint-disable linebreak-style */
// import _ from 'lodash'
// import _fp from 'lodash/fp'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  withProps,
  lifecycle,
  // withStateHandlers,
  withHandlers,
  pure,
} from 'recompose'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'

import IconTitle from 'react-icons/lib/fa/pie-chart'
import IconBarChart from 'react-icons/lib/fa/bar-chart'
import IconArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'
import IconArrowRight from 'react-icons/lib/md/keyboard-arrow-right'
import IconHelp from 'react-icons/lib/md/help'
import { ResponsiveBar } from '@nivo/bar'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
import Title from './Title'
import messages from './messages'
import StyledDropdown from '../../components/shared/StyledDropdown'

const cssClasses = classnames.bind(require('./Status.css'))

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
      sitesSelectList: state.site.selectList,
    }),
    bindActionCreators.bind(null, {
      fetchSitesForSelectList,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSitesForSelectList()
    },
  }),
  withHandlers({
    onChange: ({ history, location }) => ({ target: { value } }) => {
console.log('------siteId', value)
    },
  }),
  withProps(({ intl, location, sitesSelectList, theme }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
console.log('____sitesSelectList.items', sitesSelectList.items.toJS())
    return {
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
        .find(
          it => it.get('id') === filtersParams.get('siteId'),
          null,
          Immutable.Map()
        )
        .get('id', ''),
    }
  })
)

const data = [
  { period: 'January', confirmed: 50, unaccountable: 10 },
  { period: 'February', confirmed: 20, unaccountable: 50 },
  { period: 'March', confirmed: 90, unaccountable: 10 },
  { period: 'April', confirmed: 50, unaccountable: 30 },
  { period: 'May', confirmed: 38, unaccountable: 20 },
  { period: 'June', confirmed: 40, unaccountable: 50 },
]

export const TreatmentStatus = ({
  history,
  location,
  intl,

  className,
  title,

  isSingleSite,
  source,
  ...restProps
}) => {
  const keys = ['confirmed', 'unaccountable']
  const colors = ['rgb(65, 174, 118)', 'grey']
  const tickSeparatorX = `-${50 / data.length}%`

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
        <Unit sm="1-8" className={cssClasses('Treatment--ArrowLeftContainer')}>
          <IconArrowLeft size={40} color="grey" />
        </Unit>
        <Unit sm="3-4" style={{ height: 320 }}>
          <div style={{ height: 250 }}>
            <ResponsiveBar
              data={data}
              keys={keys}
              indexBy="period"
              margin={{ top: 0, right: 0, bottom: 40, left: 0 }}
              padding={0.01} // between stacks, (ratio)
              innerPadding={1} // between bars in a stack, (px)
              colors={colors}
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
                  </g>
                ),
              }}
              axisLeft={{
                tickValues: 2,
              }}
              enableGridY={false}
              enableLabel={false}
              // labelSkipWidth={12}
              // labelSkipHeight={12}
              // labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              // legends={[
              //   {
              //     dataFrom: 'keys',
              //     // dataFrom: d => {
              //     //   console.log('____', { d })
              //     //   return { label: 'aaaaaa', id: '1', color: 'red' }
              //     // },
              //     anchor: 'bottom-left',
              //     direction: 'row',
              //     justify: false,
              //     translateX: 5,
              //     translateY: 80,
              //     itemsSpacing: 2,
              //     itemWidth: 200,
              //     itemHeight: 20,
              //     itemDirection: 'left-to-right',
              //     itemOpacity: 0.85,
              //     symbolSize: 20,
              //     effects: [
              //       {
              //         on: 'hover',
              //         style: {
              //           itemOpacity: 1,
              //         },
              //       },
              //     ],
              //     symbolShape: CustomSymbolShape,
              //   },
              // ]}
              animate
              motionStiffness={90}
              motionDamping={15}
              tooltip={({ id, value, color, indexValue }) => (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      className={cssClasses('Treatment--graph-tooltip-color')}
                      style={{ backgroundColor: color }}
                    />
                    {`% ${id[0].toUpperCase()}${id.substr(1)} `}
                  </div>
                  <div>
                    {`${indexValue}: `}
                    <strong>{value}</strong>%
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
            {keys.map((key, index) => (
              <div className={cssClasses('Treatment--graph-legend-item')}>
                <IconBarChart size={20} color={colors[index]} />
                <span
                  className={cssClasses('Treatment--graph-legend-item-text')}
                >
                  {` % ${key[0].toUpperCase()}${key.substr(1)} `}
                </span>
                <IconHelp
                  size={15}
                  color="#34717c"
                  style={{ marginTop: -10, cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>
        </Unit>
        <Unit sm="1-8" className={cssClasses('Treatment--ArrowRightContainer')}>
          <IconArrowRight size={40} color="grey" />
        </Unit>
      </div>
    </Card>
  )
}

export default enhance(TreatmentStatus)
