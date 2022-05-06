import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsivePie from './AspectResponsivePie'

const PieGraph = ({
  assaysFromState,
  averages,
  config,
  data,
  keys,
  i18nKeys,
}) => {
  const { displayMethod, componentClasses } = config
  return (
    <AspectResponsivePie
      assaysFromState={assaysFromState}
      averages={averages}
      data={data}
      displayMethod={displayMethod}
      componentClasses={componentClasses}
      keys={keys}
      i18nKeys={i18nKeys}
      config={config}
    />
  )
}

PieGraph.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  averages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  i18nKeys: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default PieGraph
