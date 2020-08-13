/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { BoxLegendSvg } from '@nivo/legends'
import classnames from 'classnames/bind'
import IconProvider from '../../IconProvider'

import usePrevious from '../../../Hooks/CustomHooks'
import { getAverageFromData } from '../Helpers/Formatters'

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

GraphLegend.propTypes = {
  height: PropTypes.string.isRequired,
  legends: PropTypes.bool.isRequired,
  width: PropTypes.string.isRequired,
}

const PieInnerLegend = ({ averages, data }) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  const { title, key, subTitle, showTotal = false } = averages
  const [average, setAverage] = useState(0)
  const prevData = usePrevious(data)

  useEffect(() => {
    if ((!average && data) || data !== prevData) {
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
}

PieInnerLegend.propTypes = {
  averages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

const PieInnerLegendSolid = ({ data }) => {
  return (
    <div
      className={cssClasses(['legend__container', 'legend__container--solid'])}
    >
      <div
        className={cssClasses(['legend__average', 'legend__average--solid'])}
        style={{ color: 'white' }}
      >
        {data && data[0].valueLabel}
      </div>
    </div>
  )
}

const PieInnerLegendDoughNut = ({ data }) => {
  const { value, difference } = data && data[0]
  return data && data.length ? (
    <div
      className={cssClasses(['legend__container', 'legend__container--solid'])}
    >
      <div
        className={cssClasses(['legend__average', 'legend__average--doughnut'])}
      >
        {value}%
      </div>
      <div className={cssClasses('legend__averageDirectionContainer')}>
        {difference > 0 ? (
          <IconProvider
            icon="FaArrowUp"
            className="legend__averageDirectionArrow"
          />
        ) : null}
        {difference < 0 ? (
          <IconProvider
            icon="FaArrowDown"
            className="legend__averageDirectionArrow"
          />
        ) : null}
        <div>{difference}%</div>
      </div>
    </div>
  ) : null
}

export {
  GraphLegend,
  PieInnerLegend,
  PieInnerLegendSolid,
  PieInnerLegendDoughNut,
}
