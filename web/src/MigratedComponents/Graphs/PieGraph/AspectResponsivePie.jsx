import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'
import { ResponsivePie } from '@nivo/pie'
import { PieInnerLegend } from '../GraphLegend'

import {
  generateColorForValue,
  generateToolTip,
  percentageOrActualForPie,
} from '../Helpers/Formatters'

import GraphToolTip from '../GraphToolTip'

const cssClasses = classnames.bind(require('./PieGraph.css'))

const AspectResponsivePie = ({
  assaysFromState,
  averages,
  data,
  displayMethod,
  keys,
}) => {
  const { formatNumber: intlFormatNumber } = useIntl()
  return (
    <div className={cssClasses('piegraph__container')}>
      <ResponsivePie
        data={percentageOrActualForPie(data, displayMethod)}
        keys={keys}
        margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
        innerRadius={0.8}
        enableRadialLabels={false}
        enableSlicesLabels={false}
        padAngle={-1}
        startAngle={0}
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
              intlFormatNumber
            )}
          />
        )}
        colors={v => generateColorForValue(v)}
      />
      {averages && <PieInnerLegend averages={averages} data={data} />}
    </div>
  )
}

AspectResponsivePie.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  averages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default AspectResponsivePie
