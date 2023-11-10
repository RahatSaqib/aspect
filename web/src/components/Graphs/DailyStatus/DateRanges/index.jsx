import React from 'react'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import useI18n from '../../../../hooks/useI18n'
import styles from '../DailyStatus.module.css'
import { groupDateRanges } from '../Helpers'

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
    <div className={styles.dates__row}>
      <div className={styles.dates__spacer} />
      <div className={styles.dates__dayContainer}>
        {days.map(({ min, max, week, size }) => {
          return week.includes('we') ? (
            <div
              key={week}
              className={styles.dates__dayBlock}
              style={{
                width: `${(blockWidth + marginWidth) * size}px`,
              }}
            />
          ) : (
            <div
              key={week}
              className={styles.dates__dayBlock}
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
          className={styles.dates__dayBlock}
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
