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
    tickValuesY,
    tickValuesX,
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
      tickValuesY={tickValuesY}
      tickValuesX={tickValuesX}
      displayMethod={displayMethod}
      displayLegend={displayLegend}
      type={type}
    />
  )
}

export default BarGraph
