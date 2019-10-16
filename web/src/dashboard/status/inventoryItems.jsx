import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  pure,
  lifecycle,
  withProps,
  withState,
  withHandlers,
} from 'recompose'
import Card from '@material-ui/core/Card'
import { connect } from 'react-redux'
import { ResponsiveBar } from '@nivo/bar'

import { fetchInventoryDashboard } from '../DashboardRedux'
import { Unit } from '../../components/pureGrids'
import StyledDropdown from '../../components/shared/StyledDropdown'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  withState('selectInventoryItem', 'setSelectedInventoryItem', ''),
  withState('series', 'setSeries', []),
  connect(
    state => ({
      inventoryItems: state.dashboard.inventoryItems.toJS(),
    }),
    bindActionCreators.bind(null, {
      fetchInventoryDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchInventoryDashboard()
    },
  }),
  withProps(({ inventoryItems, selectInventoryItem }) => ({
    isSingleItem: inventoryItems.size === 1,
    source: inventoryItems.map(item => ({
      value: item.consumableId,
      label: item.consumableName,
    })),
    value: inventoryItems.find(it => it.consumableId === selectInventoryItem),
  })),
  withHandlers({
    onChange: ({ setSelectedInventoryItem, inventoryItems, setSeries }) => ({
      target: { value },
    }) => {
      setSelectedInventoryItem(() => value)
      setSeries(() => inventoryItems.filter(it => it.consumableId === value))
    },
  })
)

const InventoryItemBarChart = ({ data, history }) => (
  <ResponsiveBar
    data={data}
    indexBy="label"
    keys={['value']}
    margin={{ top: 10, right: 0, bottom: 90, left: 50 }}
    padding={0.01} // between stacks, (ratio)
    innerPadding={1} // between bars in a stack, (px)
    enableGridY={false}
    enableLabel={false}
    colors={bar => data.find(x => x.key === bar.data.key).color}
    animate
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Total Locations',
      legendPosition: 'middle',
      legendOffset: -40,
    }}
    onClick={() => history.push('/browse/inventory')}
    axisBottom={{
      tickSize: 3,
      tickPadding: 3,
      tickRotation: 0,
      legend: 'Supply in Stock',
      legendPosition: 'middle',
      legendOffset: 40,
    }}
    tooltip={({ indexValue }) => {
      const periodData = data.find(x => x.label === indexValue)
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={cssClasses('Performance--graph-tooltip-color')}
              style={{ backgroundColor: periodData.color }}
            />
          </div>
          <div>
            Locations:
            <strong>{periodData.value}</strong>
          </div>
        </div>
      )
    }}
    motionStiffness={90}
    motionDamping={15}
  />
)

function selectChartLabel(label) {
  switch (label) {
    case 'notRecorded':
      return {
        label: 'Not Recorded',
        color: process.env['--aspect-color-supernova'],
      }
    case 'upTo90':
      return {
        label: '1-3 Month',
        color: process.env['--aspect-color-shakespeare'],
      }
    case 'outOfStock':
      return {
        label: 'Out of Stock',
        color: process.env['--aspect-color-mandy'],
      }
    case 'moreThan180':
      return {
        label: '> 6 Months',
        color: process.env['--aspect-color-shakespeare'],
      }
    case 'upTo180':
      return {
        label: '4-6 Months',
        color: process.env['--aspect-color-shakespeare'],
      }
    case 'upTo30':
      return {
        label: '15-30 days',
        color: process.env['--aspect-color-shakespeare'],
      }
    case 'upTo14':
      return {
        label: '1-14 days',
        color: process.env['--aspect-color-shakespeare'],
      }
    case 'noConsumption':
      return {
        label: 'No Consumption',
        color: process.env['--aspect-color-supernova'],
      }
    default:
      return {
        label: '',
        color: '',
      }
  }
}

function rearrangeInventoryKey(inventoryItem) {
  return {
    outOfStock: inventoryItem.outOfStock,
    upTo14: inventoryItem.upTo14,
    upTo30: inventoryItem.upTo30,
    upTo90: inventoryItem.upTo90,
    upTo180: inventoryItem.upTo180,
    moreThan180: inventoryItem.moreThan180,
    notRecorded: inventoryItem.notRecorded,
    noConsumption: inventoryItem.noConsumption,
  }
}

export const inventoryItems = ({
  className,
  title,
  source,
  isSingleItem,
  selectInventoryItem,
  inventoryItems,
  series,
  value,
  history,
  ...restProps
}) => {
  const itemSelected = value || inventoryItems[0]
  const filteredItem = _.omit(itemSelected, ['consumableId', 'consumableName'])
  const inventoryChartLabel = rearrangeInventoryKey(filteredItem)
  const data = []

  Object.entries(inventoryChartLabel).forEach(([key, value]) => {
    data.push({
      label: selectChartLabel(key).label,
      key,
      value,
      color: selectChartLabel(key).color,
    })
  })

  return (
    <Card className={(className, cssClasses('Inventory_Container'))}>
      <div
        className={cssClasses('TitleContainer', 'Treatment--TitleContainer')}
      >
        <div
          className={cssClasses(
            'FiltersGroup__Child',
            'FiltersGroup__Child--dropdown'
          )}
        >
          {source.length > 1 &&
            (isSingleItem ? (
              <div className={cssClasses('SiteDropdown__Label')}>
                {source[1].label}
              </div>
            ) : (
              <StyledDropdown
                displayEmpty
                source={source}
                {...restProps}
                style={{ width: 320 }}
                value={selectInventoryItem || inventoryItems[0].consumableId}
              />
            ))}
        </div>
        <Unit sm="1-8" />
      </div>
      <div>
        <Unit sm="3-4" style={{ height: 320 }}>
          <div
            style={{ height: 320 }}
            className={cssClasses('Inventory_graph_Container')}
            data-utilization-graph
          >
            <InventoryItemBarChart history={history} data={data} />
          </div>
        </Unit>
        <Unit sm="1-8" />
      </div>
    </Card>
  )
}

export default enhance(inventoryItems)
