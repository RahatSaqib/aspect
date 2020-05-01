import React, { Fragment, useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { ResponsivePie } from '@nivo/pie'
import { PieInnerLegend } from '../GraphLegend'

import {
  generateColorForValue,
  generateMargin,
  generateTickVales,
  generateToolTip,
  generateLegend,
} from '../Helpers/Formatters'

import GraphToolTip from '../GraphToolTip'

const cssClasses = classnames.bind(require('./PieGraph.css'))

const PieGraph = ({
  data,
  keys,
  displayMethod,
  assaysFromState,
  culture,
  averages,
}) => {
  return (
    <div className={cssClasses('piegraph__container')}>
      <ResponsivePie
        data={data}
        keys={keys}
        margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
        innerRadius={0.8}
        enableRadialLabels={false}
        enableSlicesLabels={false}
        padAngle={-1}
        startAngle={-45}
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
            values={generateToolTip(v, culture, displayMethod, assaysFromState)}
          />
        )}
        colors={v => generateColorForValue(v)}
      />
      {averages && <PieInnerLegend averages={averages} data={data} />}
    </div>
  )
}

export default PieGraph
