import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import useI18n from '../../../hooks/useI18n'
import styles from './GraphPlaceholders.css'

const cssClasses = classnames.bind(styles)

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
          <div className={cssClasses('placeholder__graphItem')} key={item} style={{ height: `${item}%` }} />
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

const barGraphs = ['bar', 'stacked', 'divergent', 'calendar', 'barLegacyTreatment', 'stackedDeviceActivity']
const pieGraphs = ['pie', 'pieLegacyTreatment']

const EmptyGraph = ({ type }) => {
  const { formatMessage } = useI18n()
  const title = formatMessage(messages.emptyGraphPlaceholderTitle)

  return barGraphs.includes(type) ? (
    <EmptyBarGraph title={title} />
  ) : pieGraphs.includes(type) ? (
    <EmptyPieGraph title={title} />
  ) : null
}

EmptyGraph.propTypes = {
  type: PropTypes.string.isRequired,
}

export default EmptyGraph
