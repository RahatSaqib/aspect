import React from 'react'
import Line from '../../../../components/Graphs/BarGraph/LineLayer'

const layerProps = {
  pointProps: {
    // common props
    fillColor: '#fff',
    formatText: value => {
      // show percent with 2 decimal points
      return `${Math.round(100 * value) / 100}%`
    },
    strokeWidth: 2,
    /**
     * circle
     */
    shape: 'circle',
    r: 5,
    /**
     * rect
     */
    // shape: 'rect',
    // width: 6,
    // height: 6,
    /**
     * diamond
     */
    // shape: 'diamond',
    // size: 6,
  },
  tooltipProps: {
    width: 100,
    height: 24,
  },
  strokeWidth: 3,
}

const FqrToMtbPercentageLine = propsFromBarGraph => {
  return <Line {...propsFromBarGraph} layerProps={{ ...layerProps, valueFieldName: 'FqrToMtbPercentage' }} />
}

const FqrToMtbPercentageLineWithLabel = propsFromBarGraph => {
  return (
    <Line
      {...propsFromBarGraph}
      showLabel
      showDecimals={2}
      layerProps={{ ...layerProps, valueFieldName: 'FqrToMtbPercentage' }}
    />
  )
}

export { FqrToMtbPercentageLine, FqrToMtbPercentageLineWithLabel }
