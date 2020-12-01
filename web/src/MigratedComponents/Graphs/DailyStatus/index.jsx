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
      })
    )
  })
  return output
}

const DateRanges = ({ data }) => {
  const days = groupDateRanges(data)
  console.log(data, days)
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '290px', paddingRight: '10px' }}>&nbsp;</div>
      <div style={{ display: 'flex' }}>
        {days.map(({ min, max, week, size }) =>
          week.includes('we') ? (
            <div style={{ width: `${25 * size}px` }}>&nbsp;</div>
          ) : (
            <div style={{ width: `${25 * size}px` }}>
              {min}
              {max ? ` - ${max}` : null}
            </div>
          )
        )}
      </div>
    </div>
  )
}

const Clinic = ({ name, data, total }) => {
  return (
    <div className={cssClasses('clinic__container')}>
      <div className={cssClasses('clinic__name')}>{name}</div>
      <div className={cssClasses('clinic__dayrow')}>
        {data.map(day =>
          day.isWeekend ? (
            <div className={cssClasses('clinic__day')}>x</div>
          ) : (
            <div className={cssClasses('clinic__day')} />
          )
        )}
        <div className={cssClasses('clinic__testtotal')}>{total}</div>
      </div>
    </div>
  )
}

const DailyStatus = () => {
  const startOfMonth = new Date(2020, 4, 1)
  const clinics = mockData(4, startOfMonth)
  const dateRanges = dateRangeByWeekDay(startOfMonth)
  // console.log(clinics)
  // console.log(dateRanges)

  return (
    <div>
      <DateRanges data={dateRanges} />
      {clinics.map(({ clinic: { name }, data, total }) => (
        <Clinic name={name} data={data} total={total} />
      ))}
    </div>
  )
}

export default DailyStatus
