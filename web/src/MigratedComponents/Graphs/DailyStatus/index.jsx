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

const cssClasses = classnames.bind(require('./DailyStatus.css'))

function dateRangeByWeekDay(startOfMonth) {
  // const output = []
  // const weeks = []
  const daysArray = _.range(0, getDaysInMonth(startOfMonth))

  const output = daysArray.reduce((acc, curr) => {
    // const thisWeek = getWeek(addDays(startOfMonth, curr))

    ;(
      acc[getWeek(addDays(startOfMonth, curr))] ||
      (acc[getWeek(addDays(startOfMonth, curr))] = [])
    ).push({
      week: getWeek(addDays(startOfMonth, curr)),
    })
    return acc
  }, [])

  // _.times(getDaysInMonth(startOfMonth), id => {
  //   weeks.push(`week${getWeek(addDays(startOfMonth, id))}`)
  //   // _.uniq(output)[`week${getWeek(addDays(startOfMonth, id))}`].push({
  //   //   id,
  //   //   render: !isWeekend(addDays(startOfMonth, id)),
  //   //   day: format(addDays(startOfMonth, id), 'dd'),
  //   //   week: getWeek(addDays(startOfMonth, id), { weekStartsOn: 1 }),
  //   // })
  // })

  // output.reduce((acc, curr) => {

  // }, [])

  // _.times(weeks, index => {
  //   console.log(index * 7)

  //   const dateInQuestion =
  //     index > 0 ? addDays(startOfMonth, index * 7) : startOfMonth
  //   const weekStart = startOfWeek(dateInQuestion)
  //   output.push({
  //     week: index,
  //     start: weekStart,
  //   })
  // })

  console.log(daysArray)
  // console.log(_.uniq(weeks))

  return output
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
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '290px', paddingRight: '10px' }}>&nbsp;</div>
      <div>|</div>
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
  const startOfMonth = new Date(2020, 7, 1)
  const clinics = mockData(4, startOfMonth)
  const dateRanges = dateRangeByWeekDay(startOfMonth)
  console.log(clinics)
  console.log(dateRanges)

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
