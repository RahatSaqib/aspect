import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

// eslint-disable-next-line lodash/import-scope
import _ from 'lodash'
import {
  isWeekend,
  addDays,
  format,
  startOfWeek,
  getDaysInMonth,
  getWeeksInMonth,
  getWeek,
} from 'date-fns'

import sites from './staticSites'

import data from './mockedData'

const CONSTS = {
  blockSize: {
    width: 19,
    height: 15,
    marginWidth: 6,
  },
}

const statusses = [
  'active',
  'active',
  'inactive',
  'active',
  'active',
  'downForRepair',
  'active',
  'unknown',
  'active',
  'active',
  'active',
  'active',
  'noResultsReported',
  'unknown',
]

const cssClasses = classnames.bind(require('./DailyStatus.css'))

const groupDateRanges = data => {
  const output = []
  const dateFormat = 'd/M'
  _.map(data, (v, k) => {
    const min = format(_.first(v), dateFormat)
    const max = v.length > 1 ? format(_.last(v), dateFormat) : false
    return output.push({ week: k, min, max, size: v.length })
  })
  return output
}

function dateRangeByWeekDay(startOfMonth) {
  const amountOfDays = _.range(0, getDaysInMonth(startOfMonth))
  return amountOfDays.reduce((acc, curr) => {
    const thisDay = addDays(startOfMonth, curr)
    const weekInt = getWeek(thisDay, { weekStartsOn: 1 })
    const weekIndicator = isWeekend(thisDay) ? `${weekInt}_we` : `${weekInt}_wd`
    if (!acc[weekIndicator]) {
      acc[weekIndicator] = []
    }
    acc[weekIndicator].push(thisDay)
    return acc
  }, {})
}

function mockData(cnt, startOfMonth) {
  const output = []
  _.times(cnt, id => {
    output.push({ id, clinic: sites[id], data: [], total: _.random(3, 82) })
    _.times(getDaysInMonth(startOfMonth), dId =>
      output[id].data.push({
        id: dId,
        day: format(addDays(startOfMonth, dId), 'dd/MM/yy'),
        isWeekend: isWeekend(addDays(startOfMonth, dId)),
        i18nKey: statusses[_.random(0, statusses.length - 1)],
      })
    )
  })
  return output
}

const DateRanges = ({ data }) => {
  const days = groupDateRanges(data)
  const {
    blockSize: { width: blockWidth, marginWidth },
  } = CONSTS
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
      </div>
    </div>
  )
}

const Clinic = ({ name, data, total }) => {
  const {
    blockSize: { width: blockWidth, height: blockHeight, marginWidth },
  } = CONSTS
  return (
    <div className={cssClasses('clinic__container')}>
      <div className={cssClasses('clinic__name')}>{name}</div>
      <div className={cssClasses('clinic__dayrow')}>
        {data.map(({ isWeekend, i18nKey }) =>
          isWeekend ? (
            <div
              className={cssClasses('clinic__day', 'clinic__day--weekend')}
              style={{
                width: `${blockWidth}px`,
                height: `${blockHeight}px`,
                margin: `0 ${marginWidth / 2}px`,
              }}
            />
          ) : (
            <div
              className={cssClasses('clinic__day', `clinic__day--${i18nKey}`)}
              style={{
                width: `${blockWidth}px`,
                height: `${blockHeight}px`,
                margin: `0 ${marginWidth / 2}px`,
              }}
            />
          )
        )}
        <div className={cssClasses('clinic__testtotal')}>{total}</div>
      </div>
    </div>
  )
}

const DailyStatus = () => {
  const startOfMonth = new Date(2020, 4, 1)
  const clinics = mockData(21, startOfMonth)
  const dateRanges = dateRangeByWeekDay(startOfMonth)
  // console.log(clinics)
  // console.log(dateRanges)

  return (
    <div style={{ background: 'white' }}>
      <DateRanges data={dateRanges} />
      {clinics.map(({ clinic: { name }, data, total }) => (
        <Clinic name={name} data={data} total={total} />
      ))}
    </div>
  )
}

export default DailyStatus
