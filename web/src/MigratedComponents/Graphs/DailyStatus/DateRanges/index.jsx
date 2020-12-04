import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import { groupDateRanges } from '../Helpers'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DateRanges = ({ data, consts }) => {
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
              className={cssClasses('dates__dayBlock')}
              style={{
                width: `${(blockWidth + marginWidth) * size}px`,
              }}
            />
          ) : (
            <div
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
          {/* TODO: Translations */}
          Tests
        </div>
      </div>
    </div>
  )
}

DateRanges.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    totalBlockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
}

export default DateRanges
