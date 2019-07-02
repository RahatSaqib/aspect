/* eslint-disable linebreak-style */
import React from 'react'
import PropTypes from 'prop-types'
// import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography'
// import Button from '@material-ui/core/Button'
import Link from '@material-ui/core/Link'
import NivoEngine from './engines/Nivo'
import VxEngine from './engines/Vx'

import { CHART_TYPE, CHART_ENGINE } from './constants'
import data from './sample-data.js'

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  )
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
}

const chartTypes = [
  { label: 'Bar', value: CHART_TYPE.BAR },
  { label: 'Line', value: CHART_TYPE.LINE },
  { label: 'Pie', value: CHART_TYPE.PIE },
  // { label: 'Area', value: CHART_TYPE.AREA },
]
const chartEngines = [
  { label: 'Nivo', value: CHART_ENGINE.NIVO },
  { label: 'VX', value: CHART_ENGINE.VX },
]

const leftPanelStyle = {
  minWidth: 200,
  paddingTop: 50,
  flexDirection: 'column',
  display: 'flex',
}
const rightPanelStyle = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  marginTop: 5,
  maxWidth: 1000,
}
const chartContainerStyle = {
  flexGrow: 1,
  // padding: 20,
  height: 400,
  // maxWidth: 1000,
}
const headerContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '5px 10px',
  borderBottom: '1px solid #aaa',
  // height: 30,
}
const getLinkStyle = isActive => ({
  padding: '10px',
  backgroundColor: isActive ? '#ddd' : '',
  cursor: 'pointer',
})
const UnknownEngine = ({ chartEngine }) => (
  <div>Unknown chart engine '{chartEngine}'</div>
)
const getData = chartType => {
  switch (chartType) {
    case CHART_TYPE.BAR:
      return {
        axisBottom: {
          legend: 'Country',
        },
        axisLeft: {
          legend: 'Count',
        },
        data: data.Bar,
        defs: [
          {
            id: 'dots',
            type: 'patternDots',
            background: 'inherit',
            color: '#38bcb2',
            size: 4,
            padding: 1,
            stagger: true,
          },
          {
            id: 'lines',
            type: 'patternLines',
            background: 'inherit',
            color: '#eed312',
            rotation: -45,
            lineWidth: 6,
            spacing: 10,
          },
        ],
        fill: [
          {
            match: {
              id: 'fries',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'sandwich',
            },
            id: 'lines',
          },
        ],
        groupMode: 'stacked', // or 'grouped'
        indexBy: 'country',
        keys: ['hot dog', 'burger', 'sandwich', 'kebab', 'fries', 'donut'],
        legends: [
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            itemTextColor: '#999',
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ],
      }
    case CHART_TYPE.LINE:
      return {
        data: data.Line,
        legends: [
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ],
      }
    case CHART_TYPE.PIE:
      return {
        data: data.Pie,
        defs: [
          {
            id: 'dots',
            type: 'patternDots',
            background: 'inherit',
            color: 'rgba(255, 255, 255, 0.3)',
            size: 4,
            padding: 1,
            stagger: true,
          },
          {
            id: 'lines',
            type: 'patternLines',
            background: 'inherit',
            color: 'rgba(255, 255, 255, 0.3)',
            rotation: -45,
            lineWidth: 6,
            spacing: 10,
          },
        ],
        fill: [
          {
            match: {
              id: 'ruby',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'c',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'go',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'python',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'scala',
            },
            id: 'lines',
          },
          {
            match: {
              id: 'lisp',
            },
            id: 'lines',
          },
          {
            match: {
              id: 'elixir',
            },
            id: 'lines',
          },
          {
            match: {
              id: 'javascript',
            },
            id: 'lines',
          },
        ],
        legends: [
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 56,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: '#999',
            symbolSize: 18,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ],
        margin: { top: 40, right: 80, bottom: 80, left: 80 },
      }
    default:
      return { data: [], keys: [] }
  }
}
const getChartEngine = chartEngine => {
  switch (chartEngine) {
    case CHART_ENGINE.NIVO:
      return NivoEngine
    case CHART_ENGINE.VX:
      return VxEngine
    default:
      return UnknownEngine
  }
}

export default function Samples() {
  // const [chartEngine, setChartEngine] = React.useState(CHART_ENGINE.VX)
  const [chartEngine, setChartEngine] = React.useState(CHART_ENGINE.NIVO)
  const [chartType, setChartType] = React.useState(CHART_TYPE.BAR)
  const title = 'Title - 头 - Заголовок - رأس'
  const subTitle = 'Subtitle - 字幕 - Подзаголовок - عنوان فرعي'

  const ChartEngine = getChartEngine(chartEngine)

  const chartProps = {
    chartEngine,
    chartType,
    title,
    subTitle,
    // get json with 1 required prop - 'data', and 0 or more optional props corresponding to chartType
    ...getData(chartType),
  }

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div style={leftPanelStyle}>
          {chartTypes.map(({ label, value }) => (
            <Link
              style={getLinkStyle(chartType === value)}
              color={chartType === value ? 'textPrimary' : 'textSecondary'}
              onClick={() => setChartType(value)}
            >
              {label}
            </Link>
          ))}
        </div>
        <div style={rightPanelStyle}>
          <div style={{ display: 'flex' }}>
            {chartEngines.map(({ label, value }) => (
              <Link
                style={getLinkStyle(chartEngine === value)}
                color={chartEngine === value ? 'textPrimary' : 'textSecondary'}
                onClick={() => setChartEngine(value)}
              >
                {label}
              </Link>
            ))}
          </div>
          <div style={headerContainerStyle}>
            {title && (
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                {title}
              </div>
            )}
            {subTitle && <div style={{ fontSize: '1.25em' }}>{subTitle}</div>}
          </div>
          <div style={chartContainerStyle}>
            <ChartEngine {...chartProps} />
          </div>
        </div>
      </div>
    </div>
  )
}
