import React from 'react'
import PropTypes from 'prop-types'
import AspectResponsiveCalendar from './AspectResponsiveCalendar'

const CalendarGraph = ({ data, keys, config, assaysFromState }) => {
  const { indexBy, tickValuesYShape, tickValuesXShape, displayMethod, displayLegend, type } = config

  return (
    <AspectResponsiveCalendar
      assaysFromState={assaysFromState}
      data={data}
      keys={keys}
      indexBy={indexBy}
      tickValuesYShape={tickValuesYShape}
      tickValuesXShape={tickValuesXShape}
      displayMethod={displayMethod}
      displayLegend={displayLegend}
      type={type}
    />
  )
}

CalendarGraph.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default CalendarGraph
