import React from 'react'

import Line from '../../BarGraph/LineLayer'

export const MtbToTotalPercentage = propsFromBarGraph => (
  <Line
    {...propsFromBarGraph}
    layerProps={{
      valueFieldName: 'MtbToTotalPercentage',
    }}
  />
)

export const RrdToMtbPercentage = propsFromBarGraph => (
  <Line
    {...propsFromBarGraph}
    layerProps={{
      valueFieldName: 'RrdToMtbPercentage',
    }}
  />
)
