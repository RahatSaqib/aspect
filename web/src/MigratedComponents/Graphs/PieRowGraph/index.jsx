import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsiveRow from './AspectResponsiveRow'

const PieRowGraph = ({ assaysFromState, averages, config, data, keys }) => {
  const { displayMethod, componentClasses } = config
  return (
    <AspectResponsiveRow
      assaysFromState={assaysFromState}
      averages={averages}
      data={data}
      displayMethod={displayMethod}
      componentClasses={componentClasses}
      keys={keys}
    />
  )
}

PieRowGraph.defaultProps = {
  averages: false,
}

PieRowGraph.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  averages: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default PieRowGraph
