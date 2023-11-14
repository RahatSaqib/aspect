import React from 'react'
import PropTypes from 'prop-types'
import { defineMessages, useIntl } from 'react-intl'
import styles from './GraphPlaceholders.module.css'

const messages = defineMessages({
  emptyGraphPlaceholderTitle: {
    id: 'pages.graphs.emptyGraphPlaceholderTitle',
    defaultMessage: 'No Data Available',
  },
})

const EmptyBarGraph = ({ title }) => {
  return (
    <div className={styles.placeholder__container}>
      <div className={styles.placeholder__text}>{title}</div>
      <div className={styles.placeholder__graphBar}>
        {[30, 50, 60, 40, 80, 20].map(item => (
          <div className={styles.placeholder__graphItem} key={item} style={{ height: `${item}%` }} />
        ))}
      </div>
    </div>
  )
}

const EmptyPieGraph = ({ title }) => {
  return (
    <div className={styles.placeholder__container}>
      <div className={styles.placeholder__text}>{title}</div>
      <div className={styles.placeholder__graphPie}>
        <div className={styles.placeholder__pieItem} />
      </div>
    </div>
  )
}

const barGraphs = ['bar', 'stacked', 'divergent', 'calendar', 'barLegacyTreatment', 'stackedDeviceActivity']
const pieGraphs = ['pie', 'pieLegacyTreatment']

const EmptyGraph = ({ type }) => {
  const { formatMessage } = useIntl()
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
