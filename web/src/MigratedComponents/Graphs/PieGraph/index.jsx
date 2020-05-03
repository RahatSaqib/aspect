import React, { Fragment, useEffect, useState } from 'react'
import AspectResponsivePie from './AspectResponsivePie'

const PieGraph = ({
  data,
  keys,
  config,
  culture,
  averages,
  assaysFromState,
}) => {
  const { displayMethod } = config
  return (
    <AspectResponsivePie
      data={data}
      displayMethod={displayMethod}
      keys={keys}
      culture={culture}
      averages={averages}
      assaysFromState={assaysFromState}
    />
  )
}

export default PieGraph
