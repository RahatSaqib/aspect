import React, { Fragment, useEffect, useState } from 'react'
import { BoxLegendSvg } from '@nivo/legends'
import classnames from 'classnames/bind'
import { getAverageFromData } from '../Helpers/Formatters'

const cssClasses = classnames.bind(require('./GraphLegend.css'))

const GraphLegend = ({ height, legends, width }) => {
  return (
    <Fragment>
      {legends && legends.length
        ? legends.map(legend => (
            <BoxLegendSvg
              key={JSON.stringify(legend.data.map(({ id }) => id))}
              {...legend}
              containerHeight={height}
              containerWidth={width}
            />
          ))
        : null}
    </Fragment>
  )
}

const PieInnerLegend = ({ averages, data }) => {
  const { title, key, subTitle, showTotal = false } = averages
  const [average, setAverage] = useState(0)

  useEffect(() => {
    if (!average && data) {
      setAverage(getAverageFromData(data, 'value', key))
    }
  }, [average, averages, data, key])

  return (
    <div className={cssClasses('legend__container')}>
      <div
        className={cssClasses('legend__average')}
        style={{ color: average.color }}
      >
        {average.avg}%
      </div>
      {showTotal ? (
        <Fragment>
          <div className={cssClasses('legend__subTotals')}>
            {average.totals}
          </div>
          <div className={cssClasses('legend__subTitle')}>{subTitle}</div>
        </Fragment>
      ) : (
        <div className={cssClasses('legend__title')}>{title}</div>
      )}
    </div>
  )
}

export { GraphLegend, PieInnerLegend }
