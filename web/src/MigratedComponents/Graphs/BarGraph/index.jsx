import React, { Fragment, useEffect, useState } from 'react'
import AspectResponsiveBar from './AspectResponsiveBar'

const BarGraph = ({
  data,
  keys,
  config,
  culture,
  averages,
  assaysFromState,
}) => {
  const {
    indexBy,
    tickValuesYShape,
    tickValuesXShape,
    displayMethod,
    displayLegend,
    type,
  } = config
  return (
    <AspectResponsiveBar
      assaysFromState={assaysFromState}
      data={data}
      keys={keys}
      indexBy={indexBy}
      tickValuesYShape={tickValuesYShape}
      tickValuesXShape={tickValuesXShape}
      displayMethod={displayMethod}
      displayLegend={displayLegend}
      type={type}
    />
  )
}

export default BarGraph
