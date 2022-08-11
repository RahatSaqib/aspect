/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { BoxLegendSvg } from '@nivo/legends'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import IconProvider from '../../IconProvider'

import usePrevious from '../../../hooks/usePrevious'
import { getAverageFromData } from '../Helpers/Formatters'
import AspectLink from '../../AspectLink'

import messages from '../GraphsContainer/messages'
import styles from './GraphLegend.css'
import useI18n from '../../../hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

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
  const { formatMessage: intlFormatMessage } = useI18n()
  const { title, key, subTitle, showTotal = false, totalDisplayMethod = false, notation = 'standard' } = averages
  const [average, setAverage] = useState(0)
  const prevData = usePrevious(data)

  useEffect(() => {
    if ((!average && data) || data !== prevData) {
      setAverage(getAverageFromData(data, 'value', key, notation))
    }
  }, [average, averages, data, key])

  return isEmpty(average) ? null : (
    <div className={cssClasses('legend__container')}>
      <div className={cssClasses('legend__average')} style={{ color: average.color }}>
        {!totalDisplayMethod || totalDisplayMethod !== 'actual' ? `${average.avg}%` : average.totals}
      </div>
      {showTotal ? (
        <Fragment>
          {title ? (
            <div className={cssClasses('legend__subTotals')}>
              {average.totals}&nbsp;
              {intlFormatMessage(messages[title])}
            </div>
          ) : null}
          {subTitle ? (
            <div className={cssClasses('legend__subTitle')}>{intlFormatMessage(messages[subTitle])}</div>
          ) : null}
        </Fragment>
      ) : (
        <div className={cssClasses('legend__title')}>{intlFormatMessage(messages[title])}</div>
      )}
    </div>
  )
}

PieInnerLegend.propTypes = {
  averages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

const PieInnerLegendSolidBase = ({ data }) => {
  const { valueLabel } = data && data[0]
  return data && data.length ? (
    <div className={cssClasses(['legend__container', 'legend__container--solid'])}>
      <div className={cssClasses(['legend__average', 'legend__average--solid'])} style={{ color: 'white' }}>
        {valueLabel}
      </div>
    </div>
  ) : null
}

const PieInnerLegendSolid = ({ data, link }) =>
  link ? (
    <AspectLink to={link}>
      <PieInnerLegendSolidBase data={data} />
    </AspectLink>
  ) : (
    <PieInnerLegendSolidBase data={data} />
  )

const PieInnerLegendDoughNut = ({ data }) => {
  const { value, difference } = data && data[0]
  return data && data.length ? (
    <div className={cssClasses(['legend__container', 'legend__container--solid'])}>
      <div className={cssClasses(['legend__average', 'legend__average--doughnut'])}>{value}%</div>
      <div className={cssClasses('legend__averageDirectionContainer')}>
        {difference > 0 ? <IconProvider icon="FaArrowUp" className="legend__averageDirectionArrow" /> : null}
        {difference < 0 ? <IconProvider icon="FaArrowDown" className="legend__averageDirectionArrow" /> : null}
        <div>{difference}%</div>
      </div>
    </div>
  ) : null
}

export { GraphLegend, PieInnerLegend, PieInnerLegendSolid, PieInnerLegendDoughNut }
