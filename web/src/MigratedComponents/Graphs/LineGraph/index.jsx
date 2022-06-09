import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsiveLine from './AspectResponsiveLine'

const LineGraph = ({ data, keys, config, assaysFromState, i18nKeys }) => {
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
    <AspectResponsiveLine
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

LineGraph.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  i18nKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default LineGraph
