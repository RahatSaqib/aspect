import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { ResponsivePie } from '@nivo/pie'
import { PieInnerLegend, PieInnerLegendSolid, PieInnerLegendDoughNut } from '../GraphLegend'
import messages from '../intlMessages'
import { generateColorForValue, generateToolTip, percentageOrActualForPie } from '../Helpers/Formatters'

import { GraphToolTip } from '../GraphToolTip'

import styles from './PieGraph.css'
import useI18n from '../../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const AspectResponsivePie = ({
  assaysFromState,
  averages,
  data,
  displayMethod,
  componentClasses,
  keys,
  type = false,
  link,
  i18nKeys,
  config: baseConfig,
}) => {
  const { id: graphId } = baseConfig
  const { formatNumber: intlFormatNumber, formatMessage } = useI18n()
  const config = (type, data, displayMethod) => {
    switch (true) {
      case type === 'doughnut':
        return {
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          data,
          radius: 0.65,
          endAngle: 360,
          interactive: false,
        }

      case type === 'solid':
        return {
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          data,
          radius: 0,
          endAngle: 360,
          interactive: false,
        }

      default:
        return {
          margin: { top: 30, right: 30, bottom: 30, left: 30 },
          data: percentageOrActualForPie(data, displayMethod),
          radius: 0.8,
          endAngle: -360,
          interactive: true,
        }
    }
  }

  return (
    <div className={cssClasses(componentClasses)}>
      <ResponsivePie
        data={config(type, data, displayMethod).data}
        keys={keys}
        margin={config(type).margin}
        innerRadius={config(type).radius}
        enableRadialLabels={false}
        enableSlicesLabels={false}
        padAngle={-1}
        startAngle={0}
        endAngle={config(type).endAngle}
        isInteractive={config(type).interactive}
        cornerRadius={3}
        borderWidth={0}
        borderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
        radialLabelsSkipAngle={10}
        radialLabelsTextXOffset={6}
        radialLabelsTextColor="#333333"
        radialLabelsLinkOffset={0}
        radialLabelsLinkDiagonalLength={16}
        radialLabelsLinkHorizontalLength={24}
        radialLabelsLinkStrokeWidth={1}
        radialLabelsLinkColor={{ from: 'color' }}
        slicesLabelsSkipAngle={10}
        slicesLabelsTextColor="#333333"
        animate
        motionStiffness={90}
        motionDamping={15}
        tooltip={v => (
          <GraphToolTip
            clickThrough={false}
            displayMethod={displayMethod}
            values={generateToolTip(
              v,
              displayMethod,
              assaysFromState,
              intlFormatNumber,
              type,
              formatMessage,
              messages,
              i18nKeys
            )}
          />
        )}
        colors={v => generateColorForValue(v.id, graphId)}
      />
      {averages && !type ? <PieInnerLegend averages={averages} data={data} /> : null}
      {type === 'solid' ? <PieInnerLegendSolid data={data} link={link} /> : null}
      {type === 'doughnut' ? <PieInnerLegendDoughNut data={data} /> : null}
    </div>
  )
}

AspectResponsivePie.defaultProps = {
  type: false,
  link: false,
  i18nKeys: {},
  config: {},
}

AspectResponsivePie.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  averages: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  componentClasses: PropTypes.oneOfType([PropTypes.array]).isRequired,
  type: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  link: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  i18nKeys: PropTypes.oneOfType([PropTypes.object]),
  config: PropTypes.oneOfType([PropTypes.object]),
}

export default AspectResponsivePie
