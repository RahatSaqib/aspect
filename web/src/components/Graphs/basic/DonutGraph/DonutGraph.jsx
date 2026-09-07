/* eslint-disable no-restricted-properties */
import React from 'react'
import { Pie, measureTextWidth } from '@ant-design/plots'
import { filterColour, formatCompactNumber } from '../../graphUtils'

function renderStatistic(containerWidth, text, style) {
  const { width: textWidth, height: textHeight } = measureTextWidth(text, style)
  const R = containerWidth / 2 // r^2 = (w / 2)^2 + (h - offsetY)^2

  let scale = 1

  if (containerWidth < textWidth) {
    scale = Math.min(Math.sqrt(Math.abs(Math.pow(R, 2) / (Math.pow(textWidth / 2, 2) + Math.pow(textHeight, 2)))), 1)
  }

  return `<div style="width:${containerWidth}px;font-size:${scale}em;line-height:${scale < 1 ? 1 : 'inherit'};">
  ${text}
  </div>`
}

const DonutGraph = ({ data, graphId, showLabel, graphTitle, total, label, tooltip, legend = true }) => {
  const config = {
    data,
    color: datum => filterColour(data.find(d => d.label === datum.label).id, graphId),
    label: showLabel
      ? {
          type: 'inner',
          offset: '-50%',
          style: { textAlign: 'center' },
          autoRotate: false,
          content:
            label ||
            (obj => {
              if (obj.value < 1) return ''
              return `${obj.value}%${obj.count === undefined ? '' : ` (${formatCompactNumber(obj.count)})`}`
            }),
        }
      : false, // format for label on top of section
    statistic: {
      title: {
        offsetY: -4,
        style: { fontSize: '16px' },
        customHtml: container => {
          const { width, height } = container.getBoundingClientRect()
          const d = Math.sqrt(Math.pow(width / 2, 3) + Math.pow(height / 2, 3))
          return renderStatistic(d, graphTitle, { fontSize: 16 })
        },
      },
      content: {
        offsetY: 4,
        style: { fontSize: '32px' },
        customHtml: container => {
          const { width } = container.getBoundingClientRect()
          return renderStatistic(width, total, { fontSize: 32 })
        },
      },
    },
    // basic config for graph, no need to update
    angleField: 'value',
    colorField: 'label',
    radius: 1,
    innerRadius: 0.64,
    tooltip: {
      formatter: datum => ({
        name: datum.label,
        value: tooltip
          ? tooltip(datum.value, datum)
          : `${datum.value}%${datum.count === undefined ? '' : ` (${datum.count.toLocaleString()})`}`,
      }),
    },
    animation: false,
    legend: legend ? { position: 'bottom' } : false,
    appendPadding: 10,
  }
  return <Pie {...config} />
}

export default DonutGraph
