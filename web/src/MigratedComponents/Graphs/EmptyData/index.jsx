import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'

import styles from './GraphPlaceholders.css'
import useI18n from '../../../Hooks/i18n/useI18n'

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

const EmptyRowPieGraph = ({ title }) => {
  return (
    <div className={cssClasses('placeholder__container')}>
      <div className={cssClasses('placeholder__text')}>{title}</div>
      <div className={cssClasses('placeholder__graphRowPie')}>
        {[0, 1].map(key => (
          <div className={cssClasses('placeholder__pieRowItemSolid')} key={key} />
        ))}
        {[0, 1, 2, 3, 4].map(key => (
          <div className={cssClasses('placeholder__pieRowItemDoughNut')} key={key} />
        ))}
      </div>
    </div>
  )
}

const EmptyGraph = ({ type }) => {
  const barGraphs = ['bar', 'stacked', 'divergent', 'calendar', 'barLegacyTreatment', 'stackedDeviceActivity']
  const pieGraphs = ['pie', 'pieLegacyTreatment']
  const pieRowGraphs = ['pieRow']
  const { formatMessage: intlFormatMessage } = useI18n()

  return (
    <Fragment>
      {barGraphs.includes(type) && <EmptyBarGraph title={intlFormatMessage(messages.emptyGraphPlaceholderTitle)} />}
      {pieGraphs.includes(type) && <EmptyPieGraph title={intlFormatMessage(messages.emptyGraphPlaceholderTitle)} />}
      {pieRowGraphs.includes(type) && (
        <EmptyRowPieGraph title={intlFormatMessage(messages.emptyGraphPlaceholderTitle)} />
      )}
    </Fragment>
  )
}

EmptyGraph.propTypes = {
  type: PropTypes.string.isRequired,
}

export default EmptyGraph
