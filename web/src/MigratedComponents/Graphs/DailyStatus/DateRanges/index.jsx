import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'

import { groupDateRanges } from '../Helpers'

import styles from '../DailyStatus.css'
import useI18n from '../../../../Hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  totalTests: {
    id: 'pages.DailyStatus.ClinicRow.totalTests',
    defaultMessage: 'Tests',
  },
})

const DateRanges = ({ data, consts }) => {
  const { formatMessage } = useI18n()

  const days = groupDateRanges(data)
  const {
    blockSize: { width: blockWidth, marginWidth },
    totalBlockSize: { width: totalBlockWidth },
  } = consts
  return (
    <div className={cssClasses('dates__row')}>
      <div className={cssClasses('dates__spacer')} />
      <div className={cssClasses('dates__dayContainer')}>
        {days.map(({ min, max, week, size }) => {
          return week.includes('we') ? (
            <div
              key={week}
              className={cssClasses('dates__dayBlock')}
              style={{
                width: `${(blockWidth + marginWidth) * size}px`,
              }}
            />
          ) : (
            <div
              key={week}
              className={cssClasses('dates__dayBlock')}
              style={{
                width: `${(blockWidth + marginWidth) * size}px`,
              }}
            >
              {min}
              {max ? ` - ${max}` : null}
            </div>
          )
        })}
        <div
          className={cssClasses('dates__dayBlock')}
          style={{
            width: `${totalBlockWidth}px`,
          }}
        >
          {formatMessage(messages.totalTests)}
        </div>
      </div>
    </div>
  )
}

DateRanges.propTypes = {
  data: PropTypes.oneOfType([PropTypes.object]).isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    totalBlockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
}

export default DateRanges
