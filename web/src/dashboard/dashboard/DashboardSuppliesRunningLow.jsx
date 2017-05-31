import React from 'react'
import ErrorRate from '../../components/graph/ErrorRate'

export const DashboardSuppliesRunningLow = ({ width, height, margin }) => {
  if (width < 10) return null

  return (
    <svg width={width} height={height}>
      <ErrorRate
        top={margin.top}
        left={margin.left}
        count={58}
        xCount={5}
        yCount={11}
        itemWidth={10}
        itemHeight={12}
        itemPadding={{ top: 1, right: 1, bottom: 1, left: 1 }}
        itemFill={index => (index >= 8 ? '#555555' : '#FF5253')}
      />
    </svg>
  )
}

export default DashboardSuppliesRunningLow
