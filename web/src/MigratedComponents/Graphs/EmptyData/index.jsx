import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl, defineMessages } from 'react-intl'

const cssClasses = classnames.bind(require('./GraphPlaceholders.css'))

export const messages = defineMessages({
  emptyGraphPlaceholderTitle: {
    id: 'pages.graphs.emptyGraphPlaceholderTitle',
    defaultMessage: 'No Data Available',
  },
})

const EmptyBarGraph = ({ title }) => {
  return (
    <div className={cssClasses('placeholder__container')}>
      <div className={cssClasses('placeholder__text')}>{title}</div>
      <div className={cssClasses('placeholder__graphBar')}>
        {[30, 50, 60, 40, 80, 20].map(item => (
          <div
            className={cssClasses('placeholder__graphItem')}
            style={{ height: `${item}%` }}
          />
        ))}
      </div>
    </div>
  )
}

const EmptyPieGraph = ({ title }) => {
  return (
    <div className={cssClasses('placeholder__container')}>
      <div className={cssClasses('placeholder__text')}>{title}</div>
      <div className={cssClasses('placeholder__graphPie')}>
        <div className={cssClasses('placeholder__pieItem')} />
      </div>
    </div>
  )
}

const EmptyGraph = ({ type }) => {
  const barGraphs = [
    'bar',
    'stacked',
    'divergent',
    'calendar',
    'barLegacyTreatment',
    'stackedDeviceActivity',
  ]
  const pieGraphs = ['pie', 'pieLegacyTreatment']
  const { formatMessage: intlFormatMessage } = useIntl()
  return (
    <Fragment>
      {barGraphs.includes(type) && (
        <EmptyBarGraph
          title={intlFormatMessage(messages.emptyGraphPlaceholderTitle)}
        />
      )}
      {pieGraphs.includes(type) && (
        <EmptyPieGraph
          title={intlFormatMessage(messages.emptyGraphPlaceholderTitle)}
        />
      )}
    </Fragment>
  )
}

EmptyGraph.propTypes = {
  type: PropTypes.string.isRequired,
}

export default EmptyGraph
