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
    id,
    type,
    size,
    componentClasses,
    api,
    indexBy,
    keyToConsume,
    tickValuesY,
    tickValuesX,
    displayMethod,
    displayLegend,
    formatDate,
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
      culture={culture}
    />
  )
}

export default BarGraph
