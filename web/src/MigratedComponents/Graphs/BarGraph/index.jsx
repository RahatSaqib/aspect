import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsiveBar from './AspectResponsiveBar'

const BarGraph = ({ data, keys, config, assaysFromState, i18nKeys }) => {
  const {
    indexBy,
    tickValuesYShape,
    tickValuesXShape,
    displayMethod,
    displayLegend,
    formatDate,
    legendsToPopover,
    legendsNotToRender,
    type,
  } = config
  return (
    <AspectResponsiveBar
      assaysFromState={assaysFromState}
      config={config}
      data={data}
      keys={keys}
      indexBy={indexBy}
      formatDate={formatDate}
      legendsToPopover={legendsToPopover}
      legendsNotToRender={legendsNotToRender}
      tickValuesYShape={tickValuesYShape}
      tickValuesXShape={tickValuesXShape}
      displayMethod={displayMethod}
      displayLegend={displayLegend}
      type={type}
      i18nKeys={i18nKeys}
    />
  )
}

BarGraph.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  i18nKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default BarGraph
