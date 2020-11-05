import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'
import { ResponsivePie } from '@nivo/pie'
import {
  PieInnerLegend,
  PieInnerLegendSolid,
  PieInnerLegendDoughNut,
} from '../GraphLegend'
import AspectLink from '../../../components/shared/AspectLink'

import {
  generateColorForValue,
  generateToolTip,
  percentageOrActualForPie,
} from '../Helpers/Formatters'

import { GraphToolTip } from '../GraphToolTip'

const cssClasses = classnames.bind(require('./PieGraph.css'))

const AspectResponsivePie = ({
  assaysFromState,
  averages,
  data,
  displayMethod,
  componentClasses,
  keys,
  type = false,
  linkTo,
}) => {
  const { formatNumber: intlFormatNumber } = useIntl()

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
      <AspectLink to={linkTo}>
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
              values={generateToolTip(
                v,
                displayMethod,
                assaysFromState,
                intlFormatNumber,
                type
              )}
            />
          )}
          colors={v => generateColorForValue(v)}
        />
        {averages && !type && (
          <PieInnerLegend averages={averages} data={data} />
        )}
        {type === 'solid' && <PieInnerLegendSolid data={data} />}
        {type === 'doughnut' && <PieInnerLegendDoughNut data={data} />}
      </AspectLink>
    </div>
  )
}

AspectResponsivePie.defaultProps = {
  type: false,
  linkTo: null,
}

AspectResponsivePie.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  averages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  componentClasses: PropTypes.oneOfType([PropTypes.array]).isRequired,
  type: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  linkTo: PropTypes.oneOfType([PropTypes.string]),
}

export default AspectResponsivePie
