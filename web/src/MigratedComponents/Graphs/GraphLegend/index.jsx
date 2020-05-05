import React, { Fragment, useEffect, useState } from 'react'
import { BoxLegendSvg } from '@nivo/legends'
import classnames from 'classnames/bind'
import { getAverageFromData } from '../Helpers/Formatters'
import IntlContext from '../Helpers/Context/i18n'

import messages from '../GraphsContainer/messages'

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
    <IntlContext.Consumer>
      {({ formatMessage: intlFormatMessage }) => {
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
                  {average.totals}&nbsp;
                  {intlFormatMessage(messages[title])}
                </div>
                <div className={cssClasses('legend__subTitle')}>
                  {intlFormatMessage(messages[subTitle])}
                </div>
              </Fragment>
            ) : (
              <div className={cssClasses('legend__title')}>
                {intlFormatMessage(messages[title])}
              </div>
            )}
          </div>
        )
      }}
    </IntlContext.Consumer>
  )
}

export { GraphLegend, PieInnerLegend }
