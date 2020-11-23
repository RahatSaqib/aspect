import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsivePie from './AspectResponsivePie'

const PieGraph = ({ assaysFromState, averages, config, data, keys }) => {
  const { displayMethod, componentClasses, type } = config
  return (
    <AspectResponsivePie
      assaysFromState={assaysFromState}
      averages={averages}
      data={data}
      displayMethod={displayMethod}
      componentClasses={componentClasses}
      keys={keys}
      type={type}
    />
  )
}

PieGraph.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  averages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default PieGraph
