import React from 'react'
import { ResponsiveCalendar } from '@nivo/calendar'
import PropTypes from 'prop-types'
import useI18n from '../../../hooks/useI18n'
import { GraphLegend } from '../GraphLegend'
import { GraphToolTip } from '../GraphToolTip'
import { generateColorForValue, generateMargin, generateToolTip, generateLegendIntl } from '../Helpers/Formatters'
import messages from '../intlMessages'

const AspectResponsiveCalendar = ({
  assaysFromState,
  culture,
  data,
  displayLegend,
  displayMethod,
  indexBy,
  keys,
  tickValuesYShape,
}) => {
  const { formatNumber: intlFormatNumber, formatMessage } = useI18n()
  const legends = displayLegend
    ? [
        {
          dataFrom: 'keys',
          data: keys && keys.map(k => generateLegendIntl(formatMessage, messages, k, assaysFromState)),
          anchor: 'bottom-right',
          direction: 'row',
          justify: false,
          translateX: -25,
          translateY: 60,
          itemsSpacing: 2,
          itemWidth: 120,
          itemHeight: 20,
          itemDirection: 'right-to-left',
          itemOpacity: 0.85,
          symbolSize: 20,
          symbolShape: 'circle',
          effects: [
            {
              on: 'hover',
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]
    : []
  return (
    <ResponsiveCalendar
      data={data}
      keys={keys}
      indexBy={indexBy}
      colorBy="index"
      enableLabel={false}
      enableGridY={false}
      padding={0.3}
      borderWidth={0}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      labelSkipWidth={12}
      labelSkipHeight={12}
      animate
      motionStiffness={90}
      motionDamping={15}
      layers={['grid', 'axes', 'bars', 'markers', GraphLegend]}
      colors={v => generateColorForValue(v)}
      margin={generateMargin(tickValuesYShape, displayLegend)}
      tooltip={v => (
        <GraphToolTip values={generateToolTip(v, culture, displayMethod, assaysFromState, intlFormatNumber)} />
      )}
      legends={legends}
    />
  )
}

AspectResponsiveCalendar.defaultProps = {
  tickValuesYShape: 'all',
}

AspectResponsiveCalendar.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  culture: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayLegend: PropTypes.bool.isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  indexBy: PropTypes.string.isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  tickValuesYShape: PropTypes.oneOf(['bookends', 'clubsandwich', 'all', 'none']),
}

export default AspectResponsiveCalendar
