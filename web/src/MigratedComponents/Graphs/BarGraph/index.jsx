import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsiveBar from './AspectResponsiveBar'

const BarGraph = ({ data, keys, config, assaysFromState }) => {
  const {
    indexBy,
    tickValuesYShape,
    tickValuesXShape,
    displayMethod,
    displayLegend,
    legendsToRename,
    legendsToPopover,
    type,
  } = config
  return (
    <AspectResponsiveBar
      assaysFromState={assaysFromState}
      data={data}
      keys={keys}
      indexBy={indexBy}
      legendsToRename={legendsToRename}
      legendsToPopover={legendsToPopover}
      tickValuesYShape={tickValuesYShape}
      tickValuesXShape={tickValuesXShape}
      displayMethod={displayMethod}
      displayLegend={displayLegend}
      type={type}
    />
  )
}

BarGraph.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default BarGraph
