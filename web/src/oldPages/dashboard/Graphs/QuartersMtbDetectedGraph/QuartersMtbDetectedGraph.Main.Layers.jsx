import React from 'react'
import Line from '../../../../components/Graphs/BarGraph/LineLayer'

const layerProps = {
  pointProps: {
    fillColor: '#fff',
    formatText: value => `${Math.round(100 * value) / 100}%`,
    strokeWidth: 2,
    shape: 'circle',
    r: 5,
  },
  tooltipProps: { width: 100, height: 24 },
  strokeWidth: 3,
}

const LineWithProps = ({ valueFieldName, ...propsFromBarGraph }) => (
  <Line {...propsFromBarGraph} layerProps={{ ...layerProps, valueFieldName }} />
)

const lineForPropWithLabel = valueFieldName => propsFromBarGraph =>
  <LineWithProps {...propsFromBarGraph} showLabel showDecimals={2} valueFieldName={valueFieldName} />

const lineForProp = valueFieldName => propsFromBarGraph =>
  <LineWithProps {...propsFromBarGraph} valueFieldName={valueFieldName} />

export { lineForProp, lineForPropWithLabel }
